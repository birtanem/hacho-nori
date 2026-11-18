// 게임(홈) 화면: 꾸민 하초 + 말풍선 + 게임 카드
import { CONFIG } from './config.js';
import { S } from './state.js';
import { GAME_LIST, HOME_LINES } from './data.js';
import { hacho } from './hacho.js';
import { toast } from './ui.js';

let lastLine = -1;
function nextLine() {
  let i;
  do { i = (Math.random() * HOME_LINES.length) | 0; } while (HOME_LINES.length > 1 && i === lastLine);
  lastLine = i;
  return HOME_LINES[i];
}

/** @param {HTMLElement} el  @param {{askReset:Function}} ctx */
export function renderHome(el, ctx) {
  el.innerHTML = `
    <div class="hero">
      <div class="bubble" aria-live="polite">${nextLine()}</div>
      <button type="button" class="hero-char" aria-label="하초 쓰다듬기">${hacho(S.equip)}</button>
    </div>
    <div class="glist">${GAME_LIST.map((g) => {
      const best = S.best[g.id];
      return `
      <button type="button" class="gcard" data-game="${g.id}">
        <div class="ic">${g.icon}</div>
        <div class="nm">${g.name}</div>
        <div class="ds">${g.desc}</div>
        <div class="bs">${best ? `최고 🪙${best}` : '&nbsp;'}</div>
      </button>`;
    }).join('')}
    </div>
    <p class="tip">게임으로 코인을 모아 쿠지를 뽑아요! (1회 🪙${CONFIG.kujiPrice})</p>
    <button type="button" class="link-small" data-act="reset">처음부터 다시하기</button>`;

  const char = el.querySelector('.hero-char');
  const bubble = el.querySelector('.bubble');

  // 하초나 말풍선을 누르면 통통 점프 + 대사 바뀜
  const poke = (e) => {
    if (!e.target.closest('.hero-char, .bubble')) return;
    char.classList.remove('jump');
    void char.offsetWidth; // 애니메이션 다시 시작
    char.classList.add('jump');
    bubble.textContent = nextLine();
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
  };
  const onClick = (e) => {
    if (e.target.closest('[data-act="reset"]')) ctx.askReset();
    else if (e.target.closest('[data-game]')) toast('게임은 7~9단계에서 만들어요');
  };
  el.addEventListener('pointerdown', poke);
  el.addEventListener('click', onClick);
  return () => {
    el.removeEventListener('pointerdown', poke);
    el.removeEventListener('click', onClick);
  };
}
