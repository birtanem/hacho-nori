// 🥞 풀빵 탑 쌓기 — 좌우로 움직이는 풀빵을 탭해서 떨어뜨려 탑을 쌓음. 30초. (도전 게임)
// - 어긋난 만큼 잘림 → 다음 풀빵은 그만큼 좁아짐
// - 5층마다 이동 속도 증가
// - 퍼펙트(오차 ≈ 3px 이내): "퍼펙트!" + 보너스 + 폭 조금 회복, 연속 퍼펙트는 보너스 증가
// - 완전히 빗나가면 맨 위 한 칸이 무너지고 폭은 처음 크기로 리셋, 게임은 계속
// - 10층부터 가끔 바람: 잎이 날리고, 움직이는 풀빵이 흔들리거나 속도가 불규칙해짐
// - 맨 꼭대기에 하초가 올라타 있음, 탑이 높아지면 카메라가 위로 따라감
// 코인 = 층수 × 1.5 + 퍼펙트 보너스 (최대 50)
import { hacho } from '../hacho.js';
import { S } from '../state.js';

/* ---------- 규칙 (그리기와 분리 — Node 시뮬레이션에서도 사용) ---------- */
export const W0 = 150;            // 처음 폭
export const BH = 28;             // 풀빵 높이
const STAGE_W = 360;
const PERFECT = 3;                // 퍼펙트 허용 오차 (px)
const PERFECT_GROW = 8;           // 퍼펙트 때 폭 회복
const BASE_SPEED = 165;           // 처음 이동 속도 (px/s) — 보통 실력 ≈ 35코인 (시뮬레이션 기준)
const SPEED_UP = 0.2;             // 5층마다 +20%
const WIND_FROM = 10;
export const COIN_PER_FLOOR = 1.5;
export const PERFECT_COIN = 0.4;  // 퍼펙트 보너스 1점당 코인

export function createTower(rnd = Math.random) {
  return {
    rnd, t: 0,
    stack: [{ x: STAGE_W / 2, w: W0 }], // [0] = 접시(받침), 그 위가 1층부터
    mover: { x: 0, w: W0, dir: 1 },
    perfectStreak: 0, perfectPts: 0, perfects: 0, misses: 0, bestFloor: 0,
    wind: { on: false, left: 0, next: 4, dir: 1 },
    events: [],
  };
}
export const floorsOf = (tw) => tw.stack.length - 1;
export const speedOf = (tw) => BASE_SPEED * (1 + SPEED_UP * Math.floor(floorsOf(tw) / 5));
export const coinsOf = (tw) => floorsOf(tw) * COIN_PER_FLOOR + tw.perfectPts * PERFECT_COIN;

function resetMover(tw) {
  const m = tw.mover;
  m.dir = tw.rnd() < 0.5 ? 1 : -1;
  m.x = m.dir > 0 ? m.w / 2 : STAGE_W - m.w / 2;
}

/** 움직이는 풀빵 갱신 */
export function stepTower(tw, dt) {
  tw.t += dt;
  const m = tw.mover;
  let v = speedOf(tw);
  // 바람 (10층부터 가끔)
  const wd = tw.wind;
  if (floorsOf(tw) >= WIND_FROM) {
    if (wd.on) {
      wd.left -= dt;
      if (wd.left <= 0) { wd.on = false; wd.next = 3 + tw.rnd() * 4; }
    } else {
      wd.next -= dt;
      if (wd.next <= 0) { wd.on = true; wd.left = 2.2; wd.dir = tw.rnd() < 0.5 ? 1 : -1; tw.events.push({ type: 'wind' }); }
    }
  } else wd.on = false;
  if (wd.on) v *= 1 + 0.55 * Math.sin(tw.t * 9);           // 속도가 불규칙
  m.x += m.dir * v * dt;
  const lo = m.w / 2, hi = STAGE_W - m.w / 2;
  if (m.x < lo) { m.x = lo; m.dir = 1; }
  if (m.x > hi) { m.x = hi; m.dir = -1; }
  m.wobble = wd.on ? Math.sin(tw.t * 23) * 5 : 0;           // 흔들림 (보이는 위치)
}

/** 떨어뜨리기: 결과 { kind:'perfect'|'cut'|'miss', cut? } */
export function drop(tw) {
  const m = tw.mover;
  const top = tw.stack[tw.stack.length - 1];
  const x = m.x + (m.wobble || 0);
  const dx = x - top.x;
  let res;
  if (Math.abs(dx) <= PERFECT) {
    tw.perfectStreak++;
    tw.perfects++;
    const bonus = Math.min(5, tw.perfectStreak);
    tw.perfectPts += bonus;
    const w = Math.min(W0, m.w + PERFECT_GROW);
    tw.stack.push({ x: top.x, w });
    m.w = w;
    res = { kind: 'perfect', bonus, streak: tw.perfectStreak };
  } else {
    tw.perfectStreak = 0;
    const left = Math.max(x - m.w / 2, top.x - top.w / 2);
    const right = Math.min(x + m.w / 2, top.x + top.w / 2);
    const overlap = right - left;
    if (overlap <= 0) {
      // 완전히 빗나감: 맨 위 한 칸 무너지고 폭 리셋
      tw.misses++;
      const fell = [{ x, w: m.w }];
      if (tw.stack.length > 1) fell.push(tw.stack.pop());
      m.w = W0;
      res = { kind: 'miss', fell };
    } else {
      const cut = dx > 0 ? { x: right + (x + m.w / 2 - right) / 2, w: x + m.w / 2 - right } : { x: (x - m.w / 2 + left) / 2, w: left - (x - m.w / 2) };
      tw.stack.push({ x: (left + right) / 2, w: overlap });
      m.w = overlap;
      res = { kind: 'cut', cut };
    }
  }
  tw.bestFloor = Math.max(tw.bestFloor, floorsOf(tw));
  resetMover(tw);
  return res;
}

/* ---------- 그리기 ---------- */
// roundRect 가 없는 옛 브라우저(iOS 15 등) 대비
function rrect(c, x, y, w, h, r) {
  if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function drawBread(c, x, y, w, h = BH) {
  const r = Math.min(12, h / 2, w / 2);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#f6c66d'); g.addColorStop(0.55, '#e3a144'); g.addColorStop(1, '#c47f2c');
  c.fillStyle = g;
  c.strokeStyle = '#9a5f1f'; c.lineWidth = 2;
  c.beginPath(); rrect(c, x - w / 2, y, w, h, r); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,240,200,.55)';                     // 윗면 반짝
  if (w > 14) { c.beginPath(); rrect(c, x - w / 2 + 6, y + 4, w - 12, 4, 2); c.fill(); }
  c.fillStyle = '#a8662a';                                   // 풀빵 무늬 점
  for (let px = x - w / 2 + 14; px < x + w / 2 - 8; px += 22) { c.beginPath(); c.arc(px, y + h * 0.62, 2.2, 0, Math.PI * 2); c.fill(); }
}

let st = null;

export default {
  howTo: '움직이는 풀빵을 톡! 떨어뜨려 높이 쌓아요<br>삐져나온 만큼 잘려요 · 딱 맞추면 퍼펙트!<br><small>PC: Space</small>',

  start(api) {
    const { W, H } = api;
    const pr = api.pixelRatio;
    api.stage.innerHTML = '<canvas class="gcv"></canvas>';
    const cv = api.stage.querySelector('canvas');
    cv.width = W * pr; cv.height = H * pr;
    const c = cv.getContext('2d');
    c.scale(pr, pr);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hacho(S.equip, { bg: false }));

    const tw = createTower();
    resetMover(tw);
    st = { tw, cam: 0, falling: [], pops: [], leaves: [], hop: 0, flash: 0 };
    api.startTimer();
    api.setInfo('0층');

    const BASE_Y = H - 70;                                   // 접시 윗면 (월드 좌표, 아래가 +)
    const floorY = (i) => BASE_Y - i * BH;                   // i층 풀빵의 위쪽 y
    const hover = 92;                                           // 움직이는 풀빵이 탑 위로 떠 있는 높이
    let dropping = null;                                     // 떨어지는 중인 풀빵 { x, y, w, vy }

    const doDrop = () => {
      if (dropping) return;
      const m = tw.mover;
      dropping = { x: m.x + (m.wobble || 0), y: floorY(floorsOf(tw)) - hover - BH, w: m.w, vy: 0 };
    };
    api.listen(cv, 'pointerdown', (e) => { e.preventDefault(); doDrop(); });
    api.key(['Space'], doDrop);

    api.onFrame((dt) => {
      if (!dropping) stepTower(tw, dt);
      else {
        dropping.vy += 2600 * dt;
        dropping.y += dropping.vy * dt;
        const landY = floorY(floorsOf(tw)) - BH;
        if (dropping.y >= landY) {
          // 착지 → 판정 (움직이는 풀빵 위치를 떨어뜨린 위치로 맞춰서)
          tw.mover.x = dropping.x; tw.mover.wobble = 0;
          const res = drop(tw);
          const topY = floorY(floorsOf(tw));
          if (res.kind === 'perfect') {
            st.pops.push({ x: W / 2, y: topY - 40, t: 0.9, s: res.streak > 1 ? `퍼펙트! x${res.streak}` : '퍼펙트!', big: true });
            st.flash = 0.25;
          } else if (res.kind === 'cut') {
            st.falling.push({ x: res.cut.x, y: topY, w: res.cut.w, vy: 0, vx: (res.cut.x > W / 2 ? 60 : -60), rot: 0 });
          } else {
            res.fell.forEach((f, i) => st.falling.push({ x: f.x, y: topY - (i ? 0 : BH), w: f.w, vy: -80, vx: (i ? -1 : 1) * 90, rot: 0 }));
            st.pops.push({ x: W / 2, y: topY - 40, t: 0.9, s: '와르르!', bad: true });
          }
          st.hop = 0.25;
          api.setScore(floorsOf(tw));
          api.setInfo(`${floorsOf(tw)}층`);
          dropping = null;
        }
      }
      if (tw.events.length) {
        for (const ev of tw.events) if (ev.type === 'wind') st.pops.push({ x: W / 2, y: 120, t: 1.2, s: tw.wind.dir > 0 ? '바람! →' : '← 바람!', bad: true, screen: true });
        tw.events.length = 0;
      }

      // 카메라: 맨 위가 화면 위쪽 40% 근처에 오도록
      const want = Math.max(0, BASE_Y - floorY(floorsOf(tw)) - H * 0.38);
      st.cam += (want - st.cam) * Math.min(1, dt * 5);

      // 배경 (높이 올라갈수록 하늘이 짙어짐)
      const k = Math.min(1, st.cam / 1600);
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `hsl(${205 - k * 20}, ${70 + k * 10}%, ${86 - k * 22}%)`);
      g.addColorStop(1, `hsl(200, 80%, ${95 - k * 10}%)`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 6; i++) {                          // 구름 (카메라보다 천천히)
        const y = ((i * 170 + st.cam * 0.35) % (H + 120)) - 60;
        const x = (i * 97) % (W - 60) + 30;
        c.beginPath(); c.ellipse(x, y, 34, 12, 0, 0, Math.PI * 2); c.ellipse(x + 22, y - 6, 20, 10, 0, 0, Math.PI * 2); c.fill();
      }

      c.save();
      c.translate(0, st.cam);
      // 접시
      c.fillStyle = '#ffffff'; c.strokeStyle = '#c9d6e2'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(W / 2, BASE_Y + 6, W0 / 2 + 30, 12, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#bfe6a8'; c.fillRect(0, BASE_Y + 20, W, 400);
      // 탑
      for (let i = 1; i < tw.stack.length; i++) drawBread(c, tw.stack[i].x, floorY(i), tw.stack[i].w);
      // 하초 (꼭대기)
      const top = tw.stack[tw.stack.length - 1];
      const hw = 64, hh = hw * 270 / 240;
      const hopY = st.hop > 0 ? -Math.sin((st.hop / 0.25) * Math.PI) * 14 : 0;
      st.hop = Math.max(0, st.hop - dt);
      const hy = floorY(floorsOf(tw)) - hh + 12 + hopY;
      if (img.complete && img.naturalWidth) c.drawImage(img, top.x - hw / 2, hy, hw, hh);
      // 움직이는 / 떨어지는 풀빵
      if (dropping) drawBread(c, dropping.x, dropping.y, dropping.w);
      else drawBread(c, tw.mover.x + (tw.mover.wobble || 0), floorY(floorsOf(tw)) - hover - BH, tw.mover.w);
      // 잘려 떨어지는 조각
      st.falling = st.falling.filter((f) => {
        f.vy += 1400 * dt; f.y += f.vy * dt; f.x += f.vx * dt; f.rot += f.vx * 0.0006;
        c.save(); c.translate(f.x, f.y + BH / 2); c.rotate(f.rot); drawBread(c, 0, -BH / 2, f.w); c.restore();
        return f.y < BASE_Y + 500;
      });
      // 글자 (월드 좌표)
      st.pops = st.pops.filter((p) => {
        if (p.screen) return true;
        p.t -= dt; p.y -= 30 * dt;
        c.globalAlpha = Math.max(0, Math.min(1, p.t / 0.5));
        c.font = p.big ? '32px Jua, sans-serif' : '28px Jua, sans-serif'; c.textAlign = 'center';
        c.lineWidth = 5; c.strokeStyle = '#ffffff'; c.strokeText(p.s, p.x, p.y);
        c.fillStyle = p.bad ? '#e8590c' : '#f08c00'; c.fillText(p.s, p.x, p.y);
        c.globalAlpha = 1;
        return p.t > 0;
      });
      c.restore();

      // 바람 잎 (화면 좌표)
      if (tw.wind.on && Math.random() < 0.5) st.leaves.push({ x: tw.wind.dir > 0 ? -10 : W + 10, y: 60 + Math.random() * (H - 200), v: 260 + Math.random() * 160, a: Math.random() * 6 });
      st.leaves = st.leaves.filter((l) => {
        l.x += tw.wind.dir * l.v * dt; l.a += dt * 8;
        c.save(); c.translate(l.x, l.y + Math.sin(l.a) * 6); c.rotate(l.a);
        c.fillStyle = '#5cbf5c'; c.beginPath(); c.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2); c.fill(); c.restore();
        return l.x > -20 && l.x < W + 20;
      });
      // 화면 고정 글자 (바람!)
      st.pops = st.pops.filter((p) => {
        if (!p.screen) return true;
        p.t -= dt;
        c.globalAlpha = Math.max(0, Math.min(1, p.t / 0.4));
        c.font = '30px Jua, sans-serif'; c.textAlign = 'center';
        c.lineWidth = 5; c.strokeStyle = '#ffffff'; c.strokeText(p.s, p.x, p.y);
        c.fillStyle = '#2b7bb9'; c.fillText(p.s, p.x, p.y);
        c.globalAlpha = 1;
        return p.t > 0;
      });
      if (st.flash > 0) { c.fillStyle = `rgba(255,255,255,${st.flash})`; c.fillRect(0, 0, W, H); st.flash -= dt; }
    });
  },

  coins() { return st ? coinsOf(st.tw) : 0; },

  finish() {
    const tw = st.tw;
    return { msg: `${floorsOf(tw)}층 쌓았어요!${tw.perfects ? ` 퍼펙트 ${tw.perfects}번` : ''}${tw.misses ? ` · 와르르 ${tw.misses}번` : ''}` };
  },

  cleanup() { st = null; },
};
