// 탭 라우팅과 화면 렌더.
// 각 화면은 render(el)을 가지며, 정리할 것이 있으면 cleanup 함수를 돌려준다.
import { CONFIG } from './config.js';
import { S, subscribe, save, reset, addCoins } from './state.js';
import { MEMORIES, ITEMS, COLLECT_ITEMS } from './data.js';
import { toast, confirmModal, openModal, inputModal } from './ui.js';
import { renderHome } from './home.js';
import { renderCloset } from './closet.js';
import { renderKuji } from './kuji.js';
import { autoPaintScenes } from './pixel.js';
import { renderAlbum } from './album.js';
import { $, shuffle, today } from './util.js';

const view = $('#view');
const tabbar = $('#tabbar');
const DEBUG = new URLSearchParams(location.search).has('debug');

const VIEWS = {
  home: { render: (el) => renderHome(el, { askReset }) },
  kuji: { render: (el) => renderKuji(el, { go, rerender }) },
  album: { render: (el) => renderAlbum(el) }, // 엔딩 다시 보기는 10단계에서 연결
  closet: { render: renderCloset },
};

/* ---------- 라우팅 ---------- */
let current = null;
let cleanup = null;

function tabFromHash() {
  const id = location.hash.slice(1);
  return VIEWS[id] ? id : 'home';
}

function show(id, { force = false } = {}) {
  if (id === current && !force) return;
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error(e); }
  }
  cleanup = null;
  const changed = id !== current;
  current = id;
  tabbar.querySelectorAll('button').forEach((b) => {
    const on = b.dataset.tab === id;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  if (changed) view.scrollTop = 0;
  cleanup = VIEWS[id].render(view) || null;
}

/** 현재 탭을 다시 그린다 (상태가 크게 바뀐 뒤) */
export function rerender() {
  show(current, { force: true });
}

export function go(id) {
  if (location.hash !== '#' + id) location.hash = id; // hashchange 가 show() 호출
  else show(id);
}

tabbar.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (btn) go(btn.dataset.tab);
});
window.addEventListener('hashchange', () => show(tabFromHash()));

/* ---------- 코인 · 저장 실패 안내 ---------- */
const coinEl = $('#coins');
function paintCoins() {
  coinEl.textContent = S.coins;
}
subscribe((_s, { saveFailed }) => {
  paintCoins();
  if (saveFailed) toast('이 브라우저에서는 저장이 안 돼요. 창을 닫으면 사라져요', 3000);
});

/* ---------- 처음부터 다시하기 ---------- */
async function askReset() {
  const ok = await confirmModal({
    title: '정말 처음부터 다시 할까요?',
    message: '코인, 사진첩, 꾸미기 아이템, 게임 기록이 모두 사라져요.',
    okText: '처음부터',
    cancelText: '아니요',
    danger: true,
  });
  if (!ok) return;
  reset();
  go('home');
  rerender();
  view.scrollTop = 0;
  toast(`새로 시작! 🪙${CONFIG.startCoins} 받았어요`);
}

/* ---------- 개발용 (?debug) ---------- */
function setupDebug() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'debug-btn';
  btn.textContent = '🛠';
  btn.setAttribute('aria-label', '개발 도구');
  $('.topbar').insertBefore(btn, $('.coin'));
  btn.addEventListener('click', () => {
    openModal({
      html: `
        <h3 class="m-title">🛠 개발 도구</h3>
        <div class="btns col">
          <button type="button" class="btn" data-d="coin">코인 +500</button>
          <button type="button" class="btn" data-d="coin3000">코인 +3000 (40장 분량)</button>
          <button type="button" class="btn gray" data-d="items-all">아이템 전부 받기 (+왕관)</button>
          <button type="button" class="btn gray" data-d="items-half">아이템 절반 받기</button>
          <button type="button" class="btn gray" data-d="mems-half">추억 절반 받기</button>
          <button type="button" class="btn gray" data-d="input">입력 모달 테스트</button>
          <button type="button" class="btn gray" data-d="state">저장 상태 보기</button>
          <button type="button" class="btn danger" data-d="reset">처음부터 다시하기</button>
          <button type="button" class="btn gray" data-close>닫기</button>
        </div>
        <pre class="debug-pre" hidden></pre>`,
      onOpen(box, close) {
        box.addEventListener('click', async (e) => {
          const d = e.target.closest('[data-d]')?.dataset.d;
          if (d === 'coin') { addCoins(500); toast('🪙 +500'); }
          if (d === 'coin3000') { addCoins(3000); toast('🪙 +3000'); }
          if (d === 'state') {
            const pre = box.querySelector('.debug-pre');
            pre.hidden = false;
            pre.textContent = JSON.stringify(S, null, 2);
          }
          if (d === 'reset') { close(); askReset(); }
          if (d === 'mems-half') {
            const list = shuffle(MEMORIES.filter((m) => m.grade !== 'R')).slice(0, 6);
            list.forEach((m) => { S.memories[m.id] ||= { at: today() }; });
            save(); close(); rerender();
            toast(`추억 ${list.length}개 받음`);
          }
          if (d === 'items-all' || d === 'items-half') {
            const list = d === 'items-all' ? ITEMS : shuffle(COLLECT_ITEMS.slice()).slice(0, 12);
            list.forEach((i) => { S.items[i.id] ||= { at: today() }; });
            save(); close(); rerender();
            toast(`아이템 ${list.length}개 받음`);
          }
          if (d === 'input') {
            close();
            const r = await inputModal({ title: '문장 바꾸기', value: MEMORIES[0].caption, resetText: '기본 문장' });
            toast(r === null ? '취소' : r.reset ? '기본 문장으로' : `저장: ${r.value}`);
          }
        });
      },
    });
  });
}

/* ---------- 시작 ---------- */
paintCoins();
autoPaintScenes();
if (DEBUG) setupDebug();
show(tabFromHash());

// 개발 중 데이터 개수 확인 (CLAUDE.md: 추억 13, 수집 아이템 24)
if (DEBUG) console.info('[hacho] memories', MEMORIES.length, 'items', COLLECT_ITEMS.length, 'saved', save());
