// 탭 라우팅과 화면 렌더.
// 각 화면은 render(el)을 가지며, 정리할 것이 있으면 cleanup 함수를 돌려준다.
import { CONFIG } from './config.js';

const $ = (s) => document.querySelector(s);
const view = $('#view');
const tabbar = $('#tabbar');

// 0단계 임시 화면. 각 단계에서 실제 모듈(kuji.js, album.js …)로 교체한다.
const GAME_CARDS = [
  ['👆', '탭탭 하초', '쉬움'],
  ['🃏', '짝꿍 찾기', '쉬움'],
  ['🕳️', '하초 찾기', '보통'],
  ['🍃', '잎사귀 받기', '보통'],
  ['🛼', '롤러스케이트 하초', '보통'],
  ['🥞', '풀빵 탑 쌓기', '어려움'],
];

const placeholder = (ic, title, step) => (el) => {
  el.innerHTML = `
    <h2 class="h2">${ic} ${title}</h2>
    <div class="card placeholder"><div class="ic">${ic}</div><p>${step}단계에서 만들어요</p></div>`;
};

const VIEWS = {
  home: {
    render(el) {
      el.innerHTML = `
        <div class="hero"><div class="placeholder" style="margin:0;padding:18px">하초 자리 (2·3단계)</div></div>
        <div class="glist">${GAME_CARDS.map(([ic, nm, lv]) => `
          <button type="button" class="gcard"><div class="ic">${ic}</div><div class="nm">${nm}</div><div class="ds">${lv} · 7~9단계</div></button>`).join('')}
        </div>
        <p class="tip">게임으로 코인을 모아 쿠지를 뽑아요! (1회 🪙${CONFIG.kujiPrice})</p>`;
    },
  },
  kuji: { render: placeholder('🎫', '쿠지', 4) },
  album: { render: placeholder('🖼️', '사진첩', 6) },
  closet: { render: placeholder('👕', '꾸미기', 3) },
};

let current = null;
let cleanup = null;

function tabFromHash() {
  const id = location.hash.slice(1);
  return VIEWS[id] ? id : 'home';
}

function show(id) {
  if (id === current) return;
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error(e); }
  }
  cleanup = null;
  current = id;
  tabbar.querySelectorAll('button').forEach((b) => {
    const on = b.dataset.tab === id;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  view.scrollTop = 0;
  cleanup = VIEWS[id].render(view) || null;
}

export function setCoins(n) {
  $('#coins').textContent = n;
}

tabbar.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  const id = btn.dataset.tab;
  if (location.hash !== '#' + id) location.hash = id; // hashchange가 show() 호출
  else show(id);
});

window.addEventListener('hashchange', () => show(tabFromHash()));

setCoins(CONFIG.startCoins); // 1단계에서 저장된 코인으로 교체
show(tabFromHash());
