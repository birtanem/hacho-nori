// 🍃 잎사귀 받기 — 하초를 좌우로 움직여(터치 위치를 따라감) 떨어지는 것을 받기. 30초.
// 초록잎 +1, 은행잎 +3, 벌레 −3. 시간이 지날수록 빨라짐.
// 코인 = 점수 × 0.65 (최대 40). PC: ← → 이동, 마우스 이동도 가능.
import { hacho } from '../hacho.js';
import { S } from '../state.js';

const COIN_RATE = 0.65;
const PLAYER_Y = 560;       // 하초 중심 높이 (논리 좌표)
const CATCH_DX = 44;        // 받는 폭 (좌우)
const KEY_SPEED = 380;      // 화살표로 움직이는 속도 (px/s)
const ITEM = {
  leaf: { pts: 1, p: 0.66 },
  gold: { pts: 3, p: 0.17 },
  bug:  { pts: -3, p: 0.17 },
};

let st = null;

function drawLeaf(c, gold) {
  c.fillStyle = gold ? '#ffd23f' : '#5cbf5c';
  c.strokeStyle = gold ? '#c99400' : '#3a8f3a';
  c.lineWidth = 2;
  if (gold) {                                // 은행잎: 부채꼴
    c.beginPath(); c.moveTo(0, 10); c.arc(0, 10, 18, -Math.PI * 0.82, -Math.PI * 0.18); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(0, 10); c.lineTo(0, 18); c.stroke();
  } else {
    c.beginPath(); c.ellipse(0, 0, 8, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(0, -11); c.lineTo(0, 13); c.stroke();
  }
}

function drawBug(c) {
  c.fillStyle = '#8bc34a'; c.strokeStyle = '#4e7a1e'; c.lineWidth = 2;
  for (let i = 2; i >= 0; i--) { c.beginPath(); c.arc(0, i * 9 - 6, 8, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.fillStyle = '#1e2630';
  c.beginPath(); c.arc(-3, -8, 1.8, 0, Math.PI * 2); c.arc(3, -8, 1.8, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#4e7a1e';
  c.beginPath(); c.moveTo(-3, -13); c.lineTo(-6, -19); c.moveTo(3, -13); c.lineTo(6, -19); c.stroke();
}

export default {
  howTo: '하초를 좌우로 움직여 잎을 받아요!<br>🍃 +1 · 🍂 은행잎 +3 · 🐛 벌레 −3<br><small>PC: ← → 키 또는 마우스</small>',

  start(api) {
    const { W, H } = api;
    const pr = api.pixelRatio;
    api.stage.innerHTML = '<canvas class="gcv"></canvas>';
    const cv = api.stage.querySelector('canvas');
    cv.width = W * pr; cv.height = H * pr;
    const c = cv.getContext('2d');
    c.scale(pr, pr);

    // 하초 그림: 지금 꾸민 모습(배경 제외)을 이미지로
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hacho(S.equip, { bg: false }));

    st = { x: W / 2, target: W / 2, items: [], pops: [], spawn: 0.3, t: 0, got: { leaf: 0, gold: 0, bug: 0 } };
    api.startTimer();
    api.watchKeys(['ArrowLeft', 'ArrowRight']);

    const follow = (e) => { st.target = Math.max(30, Math.min(W - 30, api.toLocal(e).x)); };
    api.listen(cv, 'pointerdown', (e) => { e.preventDefault(); follow(e); });
    api.listen(cv, 'pointermove', follow);

    api.onFrame((dt) => {
      st.t += dt;
      // 키보드 이동
      const dir = (api.isDown('ArrowRight') ? 1 : 0) - (api.isDown('ArrowLeft') ? 1 : 0);
      if (dir) st.target = Math.max(30, Math.min(W - 30, st.x + dir * KEY_SPEED * dt * 1.6));
      // 부드럽게 따라가기
      st.x += (st.target - st.x) * Math.min(1, dt * 14);

      // 생성: 점점 자주, 점점 빠르게
      st.spawn -= dt;
      if (st.spawn <= 0) {
        st.spawn = Math.max(0.24, 0.55 - st.t * 0.008) + Math.random() * 0.25;
        const r = Math.random();
        const kind = r < ITEM.gold.p ? 'gold' : r < ITEM.gold.p + ITEM.bug.p ? 'bug' : 'leaf';
        st.items.push({ x: 24 + Math.random() * (W - 48), y: -24, v: 150 + Math.random() * 90 + st.t * 6, kind, a: Math.random() * 6 });
      }

      // 그리기
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#bfe6a8'; c.fillRect(0, H - 36, W, 36);
      c.fillStyle = '#a8dc8f'; for (let x = 8; x < W; x += 22) c.fillRect(x, H - 40, 4, 6);

      st.items = st.items.filter((it) => {
        it.y += it.v * dt;
        it.a += dt * 2.4;
        if (it.y > PLAYER_Y - 62 && it.y < PLAYER_Y - 10 && Math.abs(it.x - st.x) < CATCH_DX) {
          const pts = ITEM[it.kind].pts;
          st.got[it.kind]++;
          api.setScore(Math.max(0, api.score + pts));
          st.pops.push({ x: it.x, y: PLAYER_Y - 70, t: 0.7, s: (pts > 0 ? '+' : '') + pts, bad: pts < 0 });
          if (pts < 0) st.ouch = 0.35;
          return false;
        }
        if (it.y > H + 30) return false;
        c.save(); c.translate(it.x, it.y);
        if (it.kind === 'bug') drawBug(c);
        else { c.rotate(Math.sin(it.a) * 0.6); drawLeaf(c, it.kind === 'gold'); }
        c.restore();
        return true;
      });

      // 하초
      const w = 100, h = w * 270 / 240;
      c.save();
      if (st.ouch > 0) { st.ouch -= dt; c.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(st.ouch * 30)); }
      if (img.complete && img.naturalWidth) c.drawImage(img, st.x - w / 2, PLAYER_Y - h / 2 - 6, w, h);
      else { c.fillStyle = '#8fd3ff'; c.beginPath(); c.arc(st.x, PLAYER_Y, 26, 0, Math.PI * 2); c.fill(); }
      c.restore();

      // +1 글자
      st.pops = st.pops.filter((p) => {
        p.t -= dt; p.y -= 50 * dt;
        c.globalAlpha = Math.max(0, p.t / 0.7);
        c.fillStyle = p.bad ? '#e8590c' : '#2b7bb9';
        c.font = '26px Jua, sans-serif'; c.textAlign = 'center';
        c.fillText(p.s, p.x, p.y);
        c.globalAlpha = 1;
        return p.t > 0;
      });
    });
  },

  coins(api) { return api.score * COIN_RATE; },

  finish() {
    const g = st.got;
    return { msg: `🍃 ${g.leaf} · 🍂 ${g.gold}${g.bug ? ` · 🐛 ${g.bug}` : ''} 받았어요!` };
  },

  cleanup() { st = null; },
};
