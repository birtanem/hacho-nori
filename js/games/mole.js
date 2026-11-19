// 🕳️ 하초 찾기 — 3×3 구멍에서 튀어나오는 캐릭터를 탭. 20초.
// 하초 +1, 왕관 하초 +3, 벌 −2(누르면 안 됨). 점수가 오를수록 나와 있는 시간이 짧아짐.
// 코인 = 점수 × 0.7 (최대 30)
import { hacho } from '../hacho.js';

const COIN_RATE = 0.7;
const KINDS = {
  n:    { pts: 1 },
  gold: { pts: 3 },
  bee:  { pts: -2 },
};

let st = null;

function pickKind() {
  const r = Math.random();
  return r < 0.14 ? 'gold' : r < 0.32 ? 'bee' : 'n';
}

export default {
  howTo: '튀어나온 하초를 톡!<br>👑 왕관 하초는 +3 · 🐝 벌은 누르면 −2',

  start(api) {
    const art = {
      n: hacho({}, { bg: false }),
      gold: hacho({ head: 'crown' }, { bg: false }),
      bee: '<div class="bee"><span>🐝</span></div>', // 하초 SVG와 같은 비율의 칸, 몸통 위치에 벌
    };
    api.stage.innerHTML = `
      <div class="mole-grid">${'<div class="hole"><div class="pop"></div></div>'.repeat(9)}</div>`;
    const holes = [...api.stage.querySelectorAll('.hole')];
    st = { holes, hits: 0, misses: 0 };
    api.startTimer();

    // 나와 있는 시간: 950ms → 점수가 오를수록 짧게 (최소 520ms)
    const upTime = () => Math.max(520, 950 - api.score * 12);

    const popUp = () => {
      const free = holes.filter((h) => !h.classList.contains('up'));
      if (!free.length) return;
      const h = free[(Math.random() * free.length) | 0];
      const kind = pickKind();
      h.dataset.k = kind;
      h.firstElementChild.innerHTML = art[kind];
      h.classList.add('up');
      const token = (h._token = (h._token || 0) + 1);
      api.after(upTime(), () => { if (h._token === token) h.classList.remove('up'); });
    };

    // 다음에 튀어나올 때까지 간격 (점수가 오를수록 조금 빨라짐), 가끔 두 마리
    const schedule = () => {
      const gap = Math.max(330, 620 - api.score * 6) + Math.random() * 220;
      api.after(gap, () => {
        popUp();
        if (Math.random() < 0.25) popUp();
        schedule();
      });
    };
    popUp();
    schedule();

    api.listen(api.stage, 'pointerdown', (e) => {
      const h = e.target.closest('.hole');
      if (!h || !h.classList.contains('up')) return;
      e.preventDefault();
      h.classList.remove('up');
      h._token++;
      const pts = KINDS[h.dataset.k].pts;
      api.setScore(Math.max(0, api.score + pts));
      if (pts > 0) st.hits++; else st.misses++;
      h.classList.remove('hit', 'ouch');
      void h.offsetWidth;
      h.classList.add(pts > 0 ? 'hit' : 'ouch');
      const p = api.toLocal(e);
      api.float(p.x, p.y - 30, (pts > 0 ? '+' : '') + pts, pts < 0);
    });
  },

  coins(api) { return api.score * COIN_RATE; },

  finish(api) {
    return { msg: `하초를 ${st.hits}번 찾았어요!${st.misses ? ` (벌 ${st.misses}번 😵)` : ''}` };
  },

  cleanup() { st = null; },
};
