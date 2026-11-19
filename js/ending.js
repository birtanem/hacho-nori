// 엔딩 연출 (편지 없음, 장면으로 끝냄)
//  1. 추억조각 12개가 액자 속에서 한 장씩 빠르게 넘어감 (각 1.3초, 문장 함께)
//  2. 화면이 하얗게 밝아지며 무지개 장면이 크게 등장
//  3. 하초와 두나가 손잡고 통통 튀는 애니메이션 + "오래오래 매일매일 즐겁게 놀자!"
//  4. "끝" + 사진첩 보기 / 처음 화면으로
// 아무 곳이나 탭하면 다음 단계로. 다시 보기는 사진첩 상단 · 쿠지 완성 화면에서.
import { captionOf } from './album.js';
import { MEMORIES, MEMORY_BY_ID } from './data.js';
import { duna, hacho } from './hacho.js';
import { sceneHTML } from './pixel.js';
import { S, save } from './state.js';
import { $, esc } from './util.js';

const SLIDE_MS = 1300;
const RAINBOW_MS = 2600;
const DANCE_MS = 4200;

let current = null;

/**
 * @param {{go:Function}} ctx  go('album' | 'home')
 */
export function playEnding(ctx) {
  if (current) current.close();
  if (!S.endingSeen) { S.endingSeen = true; save(); }

  const el = document.createElement('div');
  el.className = 'ending';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', '엔딩');
  $('#layer').appendChild(el);

  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers.length = 0; };
  let phase = 0;

  const memories = MEMORIES.filter((m) => m.grade !== 'R' && S.memories[m.id]);
  const rainbow = MEMORY_BY_ID.rainbow;

  /* ---- 1. 추억조각 넘기기 ---- */
  function slides() {
    phase = 1;
    el.className = 'ending e-slides';
    el.innerHTML = `
      <div class="e-slide-wrap">
        <div class="e-frame frame"></div>
        <p class="e-name"></p>
        <p class="e-cap"></p>
        <p class="e-count"></p>
      </div>
      <p class="e-skip">톡 눌러서 넘기기</p>`;
    const frame = el.querySelector('.e-frame');
    const name = el.querySelector('.e-name');
    const cap = el.querySelector('.e-cap');
    const count = el.querySelector('.e-count');
    const show = (i) => {
      if (phase !== 1) return;
      if (i >= memories.length) { flash(); return; }
      const m = memories[i];
      frame.innerHTML = sceneHTML(m.id, m.name);
      name.textContent = `${m.icon} ${m.name}`;
      cap.textContent = captionOf(m.id);
      count.textContent = `${i + 1} / ${memories.length}`;
      el.querySelector('.e-slide-wrap').classList.remove('flip');
      void el.offsetWidth;
      el.querySelector('.e-slide-wrap').classList.add('flip');
      later(SLIDE_MS, () => show(i + 1));
    };
    show(0);
  }

  /* ---- 2. 하얗게 밝아지며 무지개 ---- */
  function flash() {
    clear();
    phase = 2;
    el.className = 'ending e-rainbow';
    el.innerHTML = `
      <div class="e-white"></div>
      <div class="e-big">
        <div class="frame e-rframe">${sceneHTML('rainbow', rainbow.name)}</div>
      </div>`;
    later(RAINBOW_MS, dance);
  }

  /* ---- 3. 손잡고 통통 ---- */
  function dance() {
    clear();
    phase = 3;
    el.className = 'ending e-dance';
    el.innerHTML = `
      <div class="e-scene">
        <div class="e-arc" aria-hidden="true"></div>
        <div class="e-pair">
          <div class="e-hacho">${hacho(S.equip, { bg: false })}</div>
          <div class="e-hand" aria-hidden="true">💗</div>
          <div class="e-duna">${duna()}</div>
        </div>
      </div>
      <div class="e-grass"><p class="e-line">${esc(captionOf('rainbow'))}</p></div>
      ${confetti(26)}`;
    later(DANCE_MS, end);
  }

  /* ---- 4. 끝 ---- */
  function end() {
    clear();
    phase = 4;
    el.className = 'ending e-end';
    el.innerHTML = `
      <div class="e-end-box">
        <p class="e-fin">끝</p>
        <div class="e-mini">${hacho(S.equip, { bg: false })}${duna()}</div>
        <div class="btns">
          <button type="button" class="btn gray" data-e="home">처음 화면으로</button>
          <button type="button" class="btn" data-e="album">🖼️ 사진첩 보기</button>
        </div>
      </div>
      ${confetti(14)}`;
  }

  const next = () => ({ 1: flash, 2: dance, 3: end })[phase]?.();

  const onClick = (e) => {
    const b = e.target.closest('[data-e]');
    if (b) { close(); ctx.go(b.dataset.e); return; }
    if (phase < 4) next();
  };
  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { if (phase < 4) { e.preventDefault(); next(); } }
    if (e.key === 'Escape') { close(); ctx.go('home'); }
  };
  el.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  function close() {
    clear();
    document.removeEventListener('keydown', onKey);
    el.remove();
    current = null;
  }
  current = { close };

  if (memories.length) slides(); else flash();
}

function confetti(n) {
  const cols = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#ff8fb1'];
  let s = '<div class="e-confetti" aria-hidden="true">';
  for (let i = 0; i < n; i++) {
    s += `<i style="left:${(i * 37) % 100}%;background:${cols[i % cols.length]};animation-delay:${((i * 0.23) % 2.4).toFixed(2)}s;animation-duration:${(2.6 + (i % 5) * 0.4).toFixed(1)}s"></i>`;
  }
  return s + '</div>';
}
