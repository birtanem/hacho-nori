// 🃏 짝꿍 찾기 — 카드 12장(6쌍), 40초. 시도 횟수 표시.
// 코인 = 찾은 쌍 × 4, 다 찾으면 +6 + 남은 시간 × 0.6 (최대 45)
import { shuffle } from '../util.js';

const FACES = ['🌸', '🍂', '❄️', '🎫', '🍓', '🌈'];
const PER_PAIR = 4;
const CLEAR_BONUS = 6;
const TIME_BONUS = 0.6;

let st = null;

export default {
  howTo: '같은 그림 두 장을 찾아요!<br>40초 안에 다 찾으면 남은 시간만큼 보너스',

  start(api) {
    const deck = shuffle([...FACES, ...FACES]);
    st = { open: [], found: 0, tries: 0, lock: false, bonus: 0 };
    api.stage.innerHTML = `<div class="pair-grid">${deck.map((f, i) => `
      <button type="button" class="pcard" data-i="${i}" data-f="${f}" aria-label="카드 ${i + 1}">
        <span class="back">🍃</span><span class="face">${f}</span>
      </button>`).join('')}</div>`;
    api.setInfo('시도 0');
    api.startTimer();

    api.listen(api.stage, 'pointerdown', (e) => {
      const card = e.target.closest('.pcard');
      if (!card || st.lock || card.classList.contains('on')) return;
      e.preventDefault();
      card.classList.add('on');
      st.open.push(card);
      if (st.open.length < 2) return;

      st.tries++;
      api.setInfo(`시도 ${st.tries}`);
      const [a, b] = st.open;
      st.open = [];
      if (a.dataset.f === b.dataset.f) {
        st.found++;
        api.addScore(1);
        a.classList.add('ok'); b.classList.add('ok');
        if (st.found === FACES.length) api.after(450, () => api.end());
      } else {
        st.lock = true;
        a.classList.add('no'); b.classList.add('no');
        api.after(700, () => {
          a.classList.remove('on', 'no'); b.classList.remove('on', 'no');
          st.lock = false;
        });
      }
    });
  },

  coins(api) {
    if (!st) return 0;
    const all = st.found === FACES.length;
    return st.found * PER_PAIR + (all ? CLEAR_BONUS + api.timeLeft() * TIME_BONUS : 0);
  },

  finish(api) {
    const all = st.found === FACES.length;
    const msg = all
      ? `${st.tries}번 만에 다 찾았어요! 남은 ${Math.ceil(api.timeLeft())}초 보너스`
      : `${st.found}쌍 찾았어요`;
    return { msg };
  },

  cleanup() { st = null; },
};
