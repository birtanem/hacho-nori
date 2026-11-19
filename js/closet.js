// 꾸미기 화면: 큰 하초 미리보기 + 부위별 아이템 칩 + 수집 진행도
import { S, save } from './state.js';
import { SLOTS, ITEMS, ITEM_BY_ID, COLLECT_ITEMS } from './data.js';
import { hacho } from './hacho.js';

const owned = (id) => !!S.items[id];

/** 아이템을 입힌다 (같은 부위는 교체). 쿠지 결과의 `입어보기`에서도 사용. */
export function wear(id) {
  const it = ITEM_BY_ID[id];
  if (!it || !owned(id)) return;
  S.equip[it.slot] = id;
  save();
}

/** 입고 있으면 벗기, 아니면 입기 */
function toggle(id) {
  const it = ITEM_BY_ID[id];
  if (!it || !owned(id)) return;
  if (S.equip[it.slot] === id) delete S.equip[it.slot];
  else S.equip[it.slot] = id;
  save();
}

function chip(it) {
  if (!owned(it.id)) return `<span class="chip lock" aria-label="아직 없는 아이템">🔒 ???</span>`;
  const on = S.equip[it.slot] === it.id;
  return `<button type="button" class="chip${on ? ' on' : ''}" data-item="${it.id}" aria-pressed="${on}">${it.icon} ${it.name}</button>`;
}

export function renderCloset(el) {
  const n = COLLECT_ITEMS.filter((i) => owned(i.id)).length;
  const sections = SLOTS.map((s) => {
    // 왕관(특별 아이템)은 받기 전에는 자리도 보여주지 않음 — 수집 n/30 과 맞추기 위해
    const list = ITEMS.filter((i) => i.slot === s.id && (i.grade !== 'S' || owned(i.id)));
    return `<section class="slot"><h4>${s.name}</h4><div class="chips">${list.map(chip).join('')}</div></section>`;
  }).join('');

  el.innerHTML = `
    <div class="closet-top">
      <div class="closet-char">${hacho(S.equip)}</div>
      <div class="closet-bar">
        <span class="closet-count">수집 <b>${n}</b>/${COLLECT_ITEMS.length}</span>
        <button type="button" class="btn gray small" data-act="strip"${Object.keys(S.equip).length ? '' : ' disabled'}>모두 벗기</button>
      </div>
    </div>
    ${n === 0 ? '<p class="tip">쿠지 C상·D상에서 꾸미기 아이템이 나와요 🎫</p>' : ''}
    ${sections}`;

  const charBox = el.querySelector('.closet-char');
  const stripBtn = el.querySelector('[data-act="strip"]');

  // 다시 그리지 않고 미리보기와 칩 상태만 갱신 (스크롤 위치 유지)
  const refresh = () => {
    charBox.innerHTML = hacho(S.equip);
    el.querySelectorAll('[data-item]').forEach((b) => {
      const it = ITEM_BY_ID[b.dataset.item];
      const on = S.equip[it.slot] === it.id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    stripBtn.disabled = Object.keys(S.equip).length === 0;
    charBox.classList.remove('wiggle');
    void charBox.offsetWidth;
    charBox.classList.add('wiggle');
  };

  const onClick = (e) => {
    const b = e.target.closest('[data-item]');
    if (b) { toggle(b.dataset.item); refresh(); return; }
    if (e.target.closest('[data-act="strip"]')) { S.equip = {}; save(); refresh(); }
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}
