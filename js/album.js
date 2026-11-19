// 사진첩: 추억조각 액자 그리드 · 크게 보기 · 문장 수정
import { MEMORIES, MEMORY_BY_ID } from './data.js';
import { sceneHTML } from './pixel.js';
import { S, save } from './state.js';
import { inputModal, openModal, toast } from './ui.js';
import { esc } from './util.js';

const CAPTION_MAX = 60;
const SECTIONS = [
  { grade: 'A', title: 'A상 추억조각' },
  { grade: 'B', title: 'B상 추억조각' },
  { grade: 'R', title: '무지개' },
];

export const captionOf = (id) => S.captions[id] || MEMORY_BY_ID[id].caption;

/** 추억 액자 HTML (도트 장면). 캔버스는 pixel.js 가 자동으로 그린다. */
export function memoryFrame(id) {
  const m = MEMORY_BY_ID[id];
  return `<div class="frame">${sceneHTML(id, m.name)}</div>`;
}

/** 추억조각 크게 보기 (사진첩 · 쿠지 결과에서 사용) */
export function showMemory(id) {
  const m = MEMORY_BY_ID[id];
  const got = S.memories[id];
  const edited = !!S.captions[id];
  openModal({
    html: `
      <div class="memv">
        ${memoryFrame(id)}
        <h3 class="m-title">${m.icon} ${m.name}</h3>
        <p class="cap">${esc(captionOf(id))}</p>
        ${got ? `<p class="date">${got.at} 획득${edited ? ' · 문장 바꿈' : ''}</p>` : ''}
        <div class="btns">
          ${got ? '<button type="button" class="btn gray" data-act="edit">✏️ 문장 바꾸기</button>' : ''}
          <button type="button" class="btn" data-close>닫기</button>
        </div>
      </div>`,
    onOpen(box, close) {
      box.querySelector('[data-act="edit"]')?.addEventListener('click', () => {
        close();
        editCaption(id);
      });
    },
  });
}

async function editCaption(id) {
  const m = MEMORY_BY_ID[id];
  const r = await inputModal({
    title: `${m.icon} ${m.name} 문장 바꾸기`,
    value: captionOf(id),
    maxLength: CAPTION_MAX,
    resetText: S.captions[id] ? '기본 문장으로' : '',
  });
  if (r) {
    if (r.reset || !r.value || r.value === m.caption) delete S.captions[id];
    else S.captions[id] = r.value;
    save();
    toast(r.reset ? '기본 문장으로 되돌렸어요' : '문장을 저장했어요');
  }
  showMemory(id); // 취소해도 보던 액자로 돌아감
}

function cell(m) {
  if (!S.memories[m.id]) {
    return `<div class="acell lock" aria-label="아직 모르는 추억"><div class="frame lock"><div class="pix-box q">?</div></div><span>???</span></div>`;
  }
  return `<button type="button" class="acell" data-mem="${m.id}">${memoryFrame(m.id)}<span>${m.icon} ${m.name}</span></button>`;
}

/** @param {HTMLElement} el @param {{replayEnding?:Function}} ctx */
export function renderAlbum(el, ctx = {}) {
  const total = MEMORIES.length;
  const got = MEMORIES.filter((m) => S.memories[m.id]).length;
  el.innerHTML = `
    <div class="khead">
      <h2 class="h2">🖼️ 추억 사진첩</h2>
      <span class="kleft"><b>${got}</b>/${total}</span>
    </div>
    ${S.endingSeen && ctx.replayEnding ? '<button type="button" class="btn ending-btn" data-act="ending">🌈 엔딩 다시 보기</button>' : ''}
    ${got === 0 ? '<p class="tip">쿠지 A상·B상에서 추억조각이 나와요 🎫</p>' : ''}
    ${SECTIONS.map((sec) => {
      const list = MEMORIES.filter((m) => m.grade === sec.grade);
      const n = list.filter((m) => S.memories[m.id]).length;
      return `
        <section class="asec">
          <h4><span class="gb g${sec.grade}">${sec.grade === 'R' ? '🌈' : sec.grade + '상'}</span> ${sec.title} <small>${n}/${list.length}</small></h4>
          <div class="album${sec.grade === 'R' ? ' one' : ''}">${list.map(cell).join('')}</div>
        </section>`;
    }).join('')}`;

  const onClick = (e) => {
    const b = e.target.closest('[data-mem]');
    if (b) { showMemory(b.dataset.mem); return; }
    if (e.target.closest('[data-act="ending"]')) ctx.replayEnding();
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}
