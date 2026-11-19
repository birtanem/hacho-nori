// 게임 공통 엔진
// - 앱 영역 안에 전체화면 게임을 띄움: 상단 바(나가기·제목·정보·점수) + 360×640 논리 무대
// - 무대는 비율 유지 확대·축소 (scale = min(가용폭/360, 가용높이/640)), 리사이즈·회전 시 다시 계산
// - 게임 시계: 일시정지 중에는 흐르지 않음 (화면 숨김 · 휴대폰 가로 모드)
// - 타이머·프레임·리스너는 전부 엔진이 관리하고, 끝나거나 나갈 때 한 번에 정리
// - 코인: 게임별 공식 → cap 적용 → 지급 · 최고 기록 저장. 게임 중 나가면 코인 없음.
import { CONFIG } from '../config.js';
import { GAME_LIST } from '../data.js';
import { hacho } from '../hacho.js';
import { S, save } from '../state.js';
import { $ } from '../util.js';

export const STAGE_W = 360;
export const STAGE_H = 640;

// 게임 모듈 (8·9단계에서 추가)
const MODULES = {
  tap: () => import('./tap.js'),
  pair: () => import('./pair.js'),
  mole: () => import('./mole.js'),
  catch: () => import('./catch.js'),
};
export const isPlayable = (id) => !!MODULES[id];

const PHONE_LANDSCAPE = '(orientation: landscape) and (pointer: coarse) and (max-height: 500px)';

let session = null; // 진행 중인 게임 하나

/**
 * 게임 열기
 * @param {string} id
 * @param {{onClose?:Function}} [opts]  나갈 때 호출 (홈 다시 그리기 등)
 */
export async function openGame(id, opts = {}) {
  if (!MODULES[id]) return;
  closeGame();
  const mod = (await MODULES[id]()).default;
  session = new Session(id, mod, opts);
}

export function closeGame() {
  if (session) { session.destroy(); session = null; }
}

class Session {
  constructor(id, mod, opts) {
    this.id = id;
    this.mod = mod;
    this.meta = GAME_LIST.find((g) => g.id === id);
    this.cfg = CONFIG.games[id];
    this.opts = opts;
    this.buildShell();
    this.globalOff = [];
    const onVis = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', onVis);
    this.globalOff.push(() => document.removeEventListener('visibilitychange', onVis));
    const mq = window.matchMedia(PHONE_LANDSCAPE);
    const onMq = () => { if (mq.matches) this.pause(); };
    mq.addEventListener?.('change', onMq);
    this.globalOff.push(() => mq.removeEventListener?.('change', onMq));
    const onKey = (e) => this.handleKey(e);
    const onKeyUp = (e) => { if (this.held) this.held.delete(e.code); };
    const onBlur = () => { if (this.held) this.held.clear(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    this.globalOff.push(() => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    });
    this.showIntro();
  }

  /* ---------- 화면 틀 ---------- */
  buildShell() {
    const el = document.createElement('div');
    el.className = 'game';
    el.innerHTML = `
      <div class="gbar">
        <button type="button" class="btn gray small" data-g="exit">← 나가기</button>
        <div class="gtitle">${this.meta.icon} ${this.meta.name}</div>
        <div class="pill ginfo" hidden></div>
        <div class="pill gtime">⏱ ${this.cfg.time}</div>
        <div class="pill gcoins" aria-label="지금까지 번 코인">🪙 <b>0</b></div>
      </div>
      <div class="gwrap"><div class="gstage"></div></div>`;
    $('#layer').appendChild(el);
    this.el = el;
    this.wrap = el.querySelector('.gwrap');
    this.stageEl = el.querySelector('.gstage');
    this.timeEl = el.querySelector('.gtime');
    this.infoEl = el.querySelector('.ginfo');
    this.coinEl = el.querySelector('.gcoins b');
    el.querySelector('[data-g="exit"]').addEventListener('click', () => this.exit());
    this.fit = () => {
      const s = Math.min(this.wrap.clientWidth / STAGE_W, this.wrap.clientHeight / STAGE_H);
      this.scale = s > 0 ? s : 1;
      this.stageEl.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
    };
    this.ro = 'ResizeObserver' in window ? new ResizeObserver(this.fit) : null;
    if (this.ro) this.ro.observe(this.wrap);
    window.addEventListener('resize', this.fit);
    this.fit();
  }

  /** 무대 위에 겹치는 안내 카드 (시작 · 일시정지 · 결과) */
  overlay(html, handlers = {}, { focus = true, guardMs = 0 } = {}) {
    this.closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'goverlay';
    ov.innerHTML = `<div class="gcard-ov">${html}</div>`;
    const readyAt = performance.now() + guardMs; // 연타하던 손가락이 바로 버튼을 누르지 않게
    ov.addEventListener('click', (e) => {
      if (performance.now() < readyAt) return;
      const b = e.target.closest('[data-g]');
      if (b && handlers[b.dataset.g]) handlers[b.dataset.g]();
    });
    this.wrap.appendChild(ov);
    this.ov = ov;
    if (focus) ov.querySelector('.btns .btn:last-child')?.focus({ preventScroll: true });
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  closeOverlay() { if (this.ov) { this.ov.remove(); this.ov = null; } }

  /* ---------- 흐름 ---------- */
  showIntro() {
    this.overlay(`
      <div class="gicon">${this.meta.icon}</div>
      <h2>${this.meta.name}</h2>
      <p class="ghow">${this.mod.howTo}</p>
      <div class="btns"><button type="button" class="btn" data-g="start">시작!</button></div>`,
    { start: () => this.start() });
  }

  start() {
    this.closeOverlay();
    this.resetRun();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // Space가 버튼을 누르지 않게
    this.state = 'play';
    this.mod.start(this.api);
    this.loop();
  }

  resetRun() {
    this.cleanupRun();
    this.stageEl.innerHTML = '';
    this.score = 0;
    this.shownCoins = null;
    this.infoEl.hidden = true;
    this.clock = 0;               // 게임 시계 (ms) — 일시정지 중에는 멈춤
    this.timers = [];             // { at, fn, every }
    this.frames = [];             // onFrame 콜백
    this.keys = [];               // { codes, fn }
    this.watched = new Set();     // 누르고 있는지 확인할 키
    this.held = new Set();
    this.offs = [];               // 리스너 해제
    this.timerEnd = null;         // 제한시간 끝나는 시계 값
    this.paused = false;
    this.lastTs = null;
    this.timeEl.textContent = `⏱ ${this.cfg.time}`;
    this.timeEl.classList.remove('hurry');
    this.api = this.makeApi();
    this.coinEl.textContent = '0';
  }

  loop() {
    const step = (ts) => {
      if (this.state !== 'play') return;
      this.raf = requestAnimationFrame(step);
      if (this.lastTs === null) this.lastTs = ts;
      const dt = Math.min(50, ts - this.lastTs); // 탭 전환 등으로 길게 끊겨도 최대 50ms
      this.lastTs = ts;
      if (this.paused) return;
      this.clock += dt;
      // 타이머
      for (const t of this.timers.slice()) {
        if (this.clock >= t.at) {
          if (t.every) t.at += t.every; else this.timers.splice(this.timers.indexOf(t), 1);
          t.fn();
          if (this.state !== 'play') return;
        }
      }
      for (const f of this.frames.slice()) { f(dt / 1000, this.clock / 1000); if (this.state !== 'play') return; }
      this.paintCoins();
      // 제한시간
      if (this.timerEnd !== null) {
        const left = Math.max(0, Math.ceil((this.timerEnd - this.clock) / 1000));
        if (left !== this.shownLeft) {
          this.shownLeft = left;
          this.timeEl.textContent = `⏱ ${left}`;
          this.timeEl.classList.toggle('hurry', left <= 3 && left > 0);
        }
        if (this.clock >= this.timerEnd) this.finish('time');
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  pause() {
    if (this.state !== 'play' || this.paused) return;
    this.paused = true;
    this.overlay(`
      <div class="gicon">⏸️</div>
      <h2>잠깐 멈췄어요</h2>
      <p class="gsub">준비되면 계속해요</p>
      <div class="btns"><button type="button" class="btn gray" data-g="exit">나가기</button><button type="button" class="btn" data-g="resume">계속하기</button></div>`,
    { resume: () => this.resume(), exit: () => this.exit() });
  }

  resume() {
    if (window.matchMedia(PHONE_LANDSCAPE).matches) return; // 아직 가로면 그대로
    this.closeOverlay();
    this.paused = false;
    this.lastTs = null;
  }

  /** 게임 공식으로 계산한 코인 (cap 적용 전 원래 값, cap 적용 값) */
  coinsNow() {
    const raw = Math.max(0, this.mod.coins ? this.mod.coins(this.api) : 0);
    return { raw, coins: Math.min(this.cfg.cap, Math.floor(raw)) };
  }

  paintCoins() {
    const { coins } = this.coinsNow();
    if (coins !== this.shownCoins) {
      if (this.shownCoins !== null && coins > this.shownCoins) {
        this.coinEl.parentElement.classList.remove('bump');
        void this.coinEl.offsetWidth;
        this.coinEl.parentElement.classList.add('bump');
      }
      this.shownCoins = coins;
      this.coinEl.textContent = coins;
    }
  }

  finish(reason) {
    if (this.state !== 'play') return;
    this.state = 'result';
    const { raw, coins } = this.coinsNow();
    const r = this.mod.finish ? this.mod.finish(this.api, reason) : {};
    this.paintCoins();
    this.cleanupRun();
    const prev = S.best[this.id] || 0;
    const isBest = coins > prev;
    S.coins += coins;
    if (isBest) S.best[this.id] = coins;
    save();
    this.overlay(`
      <div class="gres-char">${hacho(S.equip, { bg: false })}</div>
      <h2>끝!</h2>
      ${r.msg ? `<p class="gsub">${r.msg}</p>` : ''}
      <p class="gcoin">🪙 +${coins}${raw > this.cfg.cap ? ' <small>(최대)</small>' : ''}</p>
      <p class="gsub">${isBest ? '🎉 최고 기록!' : `최고 🪙${prev}`} · 보유 🪙${S.coins}</p>
      <div class="btns"><button type="button" class="btn gray" data-g="exit">나가기</button><button type="button" class="btn" data-g="again">다시하기</button></div>`,
    { again: () => this.start(), exit: () => this.exit() }, { focus: false, guardMs: 600 });
  }

  exit() {
    // 게임 중에 나가면 코인 없음 — finish 를 거치지 않고 그냥 정리
    closeGame();
    if (this.opts.onClose) this.opts.onClose();
  }

  cleanupRun() {
    cancelAnimationFrame(this.raf);
    if (this.mod.cleanup && this.api) { try { this.mod.cleanup(this.api); } catch (e) { console.error(e); } }
    (this.offs || []).forEach((f) => f());
    this.offs = [];
    this.timers = [];
    this.frames = [];
    this.keys = [];
  }

  destroy() {
    this.state = 'closed';
    this.cleanupRun();
    this.globalOff.forEach((f) => f());
    if (this.ro) this.ro.disconnect();
    window.removeEventListener('resize', this.fit);
    this.el.remove();
  }

  handleKey(e) {
    if (this.state !== 'play' || this.paused) return;
    if (this.watched.has(e.code)) { e.preventDefault(); this.held.add(e.code); }
    const hit = this.keys.filter((k) => k.codes.includes(e.code));
    if (!hit.length) return;
    e.preventDefault(); // 스크롤 · 포커스된 버튼 누르기 방지
    if (e.repeat) return; // 꾹 누르기는 연타로 치지 않음
    hit.forEach((k) => k.fn(e));
  }

  /* ---------- 게임이 쓰는 API ---------- */
  makeApi() {
    const self = this;
    return {
      id: this.id,
      cfg: this.cfg,
      stage: this.stageEl,
      W: STAGE_W,
      H: STAGE_H,
      get score() { return self.score; },
      setScore(n) { self.score = Math.max(0, Math.round(n)); self.paintCoins(); },
      addScore(d) { this.setScore(self.score + d); },
      setInfo(text) { self.infoEl.hidden = !text; self.infoEl.textContent = text || ''; },
      /** 제한시간 시작 (한 번만) */
      startTimer() { if (self.timerEnd === null) { self.timerEnd = self.clock + self.cfg.time * 1000; self.shownLeft = null; } },
      get timerStarted() { return self.timerEnd !== null; },
      /** 남은 시간(초, 소수) */
      timeLeft() { return self.timerEnd === null ? self.cfg.time : Math.max(0, (self.timerEnd - self.clock) / 1000); },
      get running() { return self.state === 'play' && !self.paused; },
      /** 지금 바로 끝내기 (예: 짝을 다 찾음) */
      end() { self.finish('done'); },
      /** 게임 시계 기준 타이머 (일시정지 중 멈춤) */
      after(ms, fn) { const t = { at: self.clock + ms, fn }; self.timers.push(t); return () => self.timers.splice(self.timers.indexOf(t) >>> 0, 1); },
      every(ms, fn) { const t = { at: self.clock + ms, fn, every: ms }; self.timers.push(t); return () => self.timers.splice(self.timers.indexOf(t) >>> 0, 1); },
      onFrame(fn) { self.frames.push(fn); },
      /** 리스너 등록 (끝나면 자동 해제) */
      listen(target, type, fn, opts) {
        const wrapped = (e) => { if (self.state === 'play' && !self.paused) fn(e); };
        target.addEventListener(type, wrapped, opts);
        self.offs.push(() => target.removeEventListener(type, wrapped, opts));
      },
      /** 키 입력 (예: ['Space']) — 꾹 누름 반복은 무시 */
      key(codes, fn) { self.keys.push({ codes, fn }); },
      /** 누르고 있는 동안 계속 확인할 키 (예: 화살표 이동) */
      watchKeys(codes) { codes.forEach((c) => self.watched.add(c)); },
      isDown(code) { return self.held.has(code); },
      /** 캔버스를 선명하게 그리기 위한 배율 (무대 확대 × 기기 픽셀 비율) */
      get pixelRatio() { return Math.min(3, Math.max(1, self.scale * (window.devicePixelRatio || 1))); },
      /** 화면 좌표 → 무대 논리 좌표 */
      toLocal(e) {
        const r = self.stageEl.getBoundingClientRect();
        return { x: (e.clientX - r.left) / self.scale, y: (e.clientY - r.top) / self.scale };
      },
      /** 무대 위 떠오르는 글자 (+1 등) */
      float(x, y, text, bad = false) {
        const d = document.createElement('div');
        d.className = 'gfloat' + (bad ? ' bad' : '');
        d.textContent = text;
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        self.stageEl.appendChild(d);
        setTimeout(() => d.remove(), 700);
      },
    };
  }
}
