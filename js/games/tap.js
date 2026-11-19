// 👆 탭탭 하초 — 큰 하초(현재 꾸민 모습)를 마구 탭. 첫 탭에 타이머 시작. 코인 = 탭 수 ÷ 4
import { hacho } from '../hacho.js';
import { S } from '../state.js';

export default {
  howTo: '하초를 마구마구 눌러요!<br>첫 탭부터 10초 · 4번에 🪙1<br><small>PC: Space 연타도 OK</small>',

  start(api) {
    api.stage.innerHTML = `
      <div class="tap-wrap">
        <p class="tap-hint">하초를 누르면 시작!</p>
        <div class="tap-char">${hacho(S.equip)}</div>
      </div>`;
    const ch = api.stage.querySelector('.tap-char');
    const hint = api.stage.querySelector('.tap-hint');

    const hit = (x, y) => {
      if (!api.timerStarted) { api.startTimer(); hint.textContent = '빨리빨리!'; }
      api.addScore(1);
      ch.classList.remove('boing');
      void ch.offsetWidth;
      ch.classList.add('boing');
      api.float(x, y, '+1');
    };
    api.listen(ch, 'pointerdown', (e) => {
      e.preventDefault();
      const p = api.toLocal(e);
      hit(p.x, p.y - 20);
    });
    api.key(['Space'], () => hit(180 + (Math.random() * 80 - 40), 300 + (Math.random() * 60 - 30)));
  },

  coins(api) { return api.score / 4; },

  finish(api) {
    return { msg: `${api.score}번 눌렀어요!` };
  },
};
