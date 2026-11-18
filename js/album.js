// 사진첩 (6단계에서 화면 전체를 만든다). 지금은 쿠지 결과에서 쓰는 액자와 크게 보기만.
import { S } from './state.js';
import { MEMORY_BY_ID } from './data.js';
import { openModal } from './ui.js';
import { esc } from './util.js';
import { sceneHTML } from './pixel.js';

export const captionOf = (id) => S.captions[id] || MEMORY_BY_ID[id].caption;

/** 추억 액자 HTML (도트 장면). 캔버스는 pixel.js 가 자동으로 그린다. */
export function memoryFrame(id) {
  const m = MEMORY_BY_ID[id];
  return `<div class="frame">${sceneHTML(id, m.name)}</div>`;
}

/** 추억조각 크게 보기 */
export function showMemory(id) {
  const m = MEMORY_BY_ID[id];
  const got = S.memories[id];
  openModal({
    html: `
      <div class="memv">
        ${memoryFrame(id)}
        <h3 class="m-title">${m.icon} ${m.name}</h3>
        <p class="cap">${esc(captionOf(id))}</p>
        ${got ? `<p class="date">${got.at} 획득</p>` : ''}
        <div class="btns"><button type="button" class="btn" data-close>닫기</button></div>
      </div>`,
  });
}
