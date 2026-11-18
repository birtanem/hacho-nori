// 쿠지: 박스 생성 · 뽑기 처리 · 보드 화면 · 결과 모달
// 종이의 "등급"만 박스를 만들 때 섞어 두고, 등급 안에서 무엇이 나올지는 뽑는 순간
// 아직 안 나온 것 중에서 고른다 → 중복 없음, 40장을 다 뽑으면 36개가 정확히 모임.
import { CONFIG } from './config.js';
import { S, save } from './state.js';
import { MEMORIES, MEMORY_BY_ID, ITEMS, ITEM_BY_ID, COLLECT_ITEMS, BOX_COUNT, BOX_GRADES, GRADES } from './data.js';
import { hacho } from './hacho.js';
import { openModal, toast } from './ui.js';
import { wear } from './closet.js';
import { memoryFrame, showMemory } from './album.js';
import { pick, shuffle, today } from './util.js';

const PAPERS = Object.values(BOX_GRADES).reduce((a, b) => a + b, 0); // 20
const GRADE_ORDER = ['A', 'B', 'C', 'D', 'E'];
const COLLECT_MEMORIES = MEMORIES.filter((m) => m.grade === 'A' || m.grade === 'B'); // 12
export const TOTAL_COLLECT = COLLECT_MEMORIES.length + COLLECT_ITEMS.length;      // 36

export const refundAmount = () => Math.round(CONFIG.kujiPrice * CONFIG.eRefundRate);

/* ---------- 상태 도우미 ---------- */
function makeBox() {
  const papers = [];
  for (const g of GRADE_ORDER) for (let i = 0; i < BOX_GRADES[g]; i++) papers.push(g);
  return { papers: shuffle(papers), opened: [] };
}

/** 현재 박스가 없으면 만든다 (1·2탄). 두 박스를 다 뽑았으면 null. */
export function ensureBox() {
  if (S.boxNo > BOX_COUNT) { S.box = null; return null; }
  const ok = S.box && S.box.papers.length === PAPERS && Array.isArray(S.box.opened);
  if (!ok) { S.box = makeBox(); save(); }
  return S.box;
}

/** 모은 개수 (무지개 진행도 n/36) */
export function collectedCount() {
  return COLLECT_MEMORIES.filter((m) => S.memories[m.id]).length +
    COLLECT_ITEMS.filter((i) => S.items[i.id]).length;
}

export const allCollected = () => collectedCount() === TOTAL_COLLECT;

/** 등급에 맞는 보상을 정해서 지급하고 결과를 돌려준다. */
function award(g) {
  if (g === 'A' || g === 'B') {
    const pool = MEMORIES.filter((m) => m.grade === g && !S.memories[m.id]);
    if (pool.length) {
      const m = pick(pool);
      S.memories[m.id] = { at: today() };
      return { g, type: 'memory', id: m.id };
    }
  }
  if (g === 'C' || g === 'D') {
    const pool = ITEMS.filter((i) => i.grade === g && !S.items[i.id]);
    if (pool.length) {
      const it = pick(pool);
      S.items[it.id] = { at: today() };
      return { g, type: 'item', id: it.id };
    }
  }
  // E상, 또는 (정상 진행에서는 생기지 않지만) 보상이 이미 다 모인 경우
  const n = refundAmount();
  S.coins += n;
  return { g, type: 'coin', amount: n, fallback: g !== 'E' };
}

/**
 * 종이 한 장 뽑기. 코인 차감 · 보상 지급 · 다음 박스 준비까지 한 번에 저장한다.
 * @returns {{ok:false, reason:string} | {ok:true, result:object, boxDone:boolean, allDone:boolean}}
 */
export function drawPaper(index) {
  const box = ensureBox();
  if (!box) return { ok: false, reason: 'done' };
  if (!(index >= 0 && index < PAPERS) || box.opened.includes(index)) return { ok: false, reason: 'opened' };
  if (S.coins < CONFIG.kujiPrice) return { ok: false, reason: 'coins' };

  S.coins -= CONFIG.kujiPrice;
  box.opened.push(index);
  const result = award(box.papers[index]);

  const boxDone = box.opened.length === PAPERS;
  if (boxDone) {
    S.boxNo += 1;
    S.box = S.boxNo <= BOX_COUNT ? makeBox() : null;
  }
  save();
  return { ok: true, result, boxDone, allDone: boxDone && S.boxNo > BOX_COUNT };
}

/* ---------- 화면 ---------- */
const badge = (g) => `<span class="gb g${g}">${GRADES[g].label}</span>`;

function boardHTML() {
  const box = S.box;
  const total = { ...BOX_GRADES };
  const left = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  box.papers.forEach((g, i) => { if (!box.opened.includes(i)) left[g]++; });
  const remain = PAPERS - box.opened.length;

  const SHORT = { A: '추억조각', B: '추억조각', C: '레어 아이템', D: '아이템', E: `🪙${refundAmount()}` };
  const rows = GRADE_ORDER.map((g) => `
    <div class="pcell${left[g] ? '' : ' out'}">${badge(g)}
      <span class="n"><b>${left[g]}</b>/${total[g]}</span>
      <span class="pname">${SHORT[g]}</span>
    </div>`).join('');

  const papers = box.papers.map((g, i) => box.opened.includes(i)
    ? `<div class="tk open g${g}" aria-label="${GRADES[g].label} 뽑힘">${g}</div>`
    : `<button type="button" class="tk" data-i="${i}" aria-label="종이 ${i + 1}">🍃</button>`).join('');

  return `
    <div class="khead">
      <h2 class="h2">🎫 하초 쿠지 <small>제${S.boxNo}탄</small></h2>
      <span class="kleft">남은 <b>${remain}</b>/${PAPERS}장</span>
    </div>
    <p class="kinfo">🌈 ${BOX_COUNT}탄까지 모든 쿠지를 모으면 <b>무지개 쿠지</b>가 열려요</p>
    <div class="prizes">${rows}</div>
    <div class="board">${papers}</div>
    <p class="tip">종이를 한 장 골라 톡! · 1회 🪙${CONFIG.kujiPrice}</p>
    ${rainbowHTML()}`;
}

function rainbowHTML() {
  const n = collectedCount();
  const open = n === TOTAL_COLLECT && !S.memories.rainbow;
  return `
    <div class="rainbow-card${open ? ' open' : ''}">
      ${open
        ? `<button type="button" class="tk rainbow" data-act="rainbow" aria-label="무지개 쿠지">🌈</button>
           <p>무지개 쿠지가 열렸어요! 톡 눌러봐요</p>`
        : `<div class="tk rainbow locked" aria-hidden="true">🔒</div>
           <p>모든 쿠지를 모으면 열려요 <b>(${n}/${TOTAL_COLLECT})</b></p>`}
    </div>`;
}

function doneHTML() {
  return `
    <h2 class="h2">🎫 하초 쿠지</h2>
    <div class="card kdone">
      <div class="ic">🎉</div>
      <p>1탄·2탄 쿠지를 모두 뽑았어요!</p>
    </div>
    ${rainbowHTML()}`;
}

function resultHTML(r) {
  let vis = '', title = '', msg = '', btn = '';
  if (r.type === 'memory') {
    const m = MEMORY_BY_ID[r.id];
    vis = memoryFrame(r.id);
    title = `${m.icon} ${m.name}`;
    msg = '추억조각을 얻었어요!';
    btn = `<button type="button" class="btn" data-act="view" data-id="${r.id}">🖼️ 보기</button>`;
  } else if (r.type === 'item') {
    const it = ITEM_BY_ID[r.id];
    vis = `<div class="res-char">${hacho({ [it.slot]: it.id })}</div>`;
    title = `${it.icon} ${it.name}`;
    msg = it.grade === 'C' ? '레어 꾸미기 아이템을 얻었어요!' : '꾸미기 아이템을 얻었어요!';
    btn = `<button type="button" class="btn" data-act="wear" data-id="${r.id}">👕 입어보기</button>`;
  } else {
    vis = '<div class="res-coin">🪙</div>';
    title = `코인 +${r.amount}`;
    msg = r.fallback ? '이미 다 모아서 코인으로 돌려받았어요' : '하초가 코인을 돌려줬어요!';
  }
  return `
    <div class="res">
      <div class="grade g${r.g}">${GRADES[r.g].label}</div>
      ${vis}
      <h3 class="m-title">${title}</h3>
      <p class="m-msg">${msg}</p>
      <div class="btns">${btn}<button type="button" class="btn gray" data-close>확인</button></div>
    </div>`;
}

let busy = false;

/** @param {HTMLElement} el @param {{go:Function, rerender:Function}} ctx */
export function renderKuji(el, ctx) {
  const box = ensureBox();
  el.innerHTML = box ? boardHTML() : doneHTML();

  const timers = [];
  const onClick = (e) => {
    if (e.target.closest('[data-act="rainbow"]')) { toast('무지개 쿠지는 10단계에서 만들어요 🌈'); return; }
    const paper = e.target.closest('.tk[data-i]');
    if (!paper || busy) return;
    if (S.coins < CONFIG.kujiPrice) {
      toast(`코인이 부족해요! 🪙${CONFIG.kujiPrice - S.coins} 더 모아봐요 🎮`);
      return;
    }
    const res = drawPaper(Number(paper.dataset.i));
    if (!res.ok) return;
    busy = true;
    paper.classList.add('shake');
    timers.push(setTimeout(() => paper.classList.add('unfold'), 480));
    timers.push(setTimeout(() => {
      busy = false;
      openResult(res, ctx);
    }, 820));
  };
  el.addEventListener('click', onClick);
  return () => {
    el.removeEventListener('click', onClick);
    timers.forEach(clearTimeout);
    busy = false;
  };
}

function openResult(res, ctx) {
  let next = null; // 모달을 닫은 뒤 할 일
  openModal({
    html: resultHTML(res.result),
    onOpen(box, close) {
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'wear') { wear(b.dataset.id); next = () => ctx.go('closet'); close(); }
        if (b.dataset.act === 'view') { next = () => showMemory(b.dataset.id); close(); }
      });
    },
    onClose() {
      ctx.rerender();
      if (res.boxDone && !res.allDone) toast(`🎉 제${S.boxNo}탄 박스가 열렸어요!`, 2400);
      if (res.allDone) toast('🌈 무지개 쿠지가 열렸어요!', 2400);
      if (next) next();
    },
  });
}
