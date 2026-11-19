// 🛼 롤러스케이트 하초 — 오른쪽으로 계속 달리는 하초, 탭 = 점프. 30초.
// 도트 스타일 자연 배경, 여러 겹 패럴랙스 (하늘·구름 / 먼 산 / 나무 / 풀밭).
// 장애물: 돌멩이·통나무·웅덩이(점프로 넘기), 버섯(작고 쉬움), 낮게 나는 벌(점프하면 부딪힘 → 그냥 달려야 통과)
// 부딪혀도 게임 오버 아님: 깜빡이며 잠깐 느려지고 콤보 끊김.
// 점수 = 달린 거리 + 공중의 초록잎·은행잎 + 장애물 콤보. 시간이 지날수록 빨라짐.
// 코인 = 점수 × COIN_RATE (최대 40)
import { chara, tools } from '../pixel.js';

/* ---------- 규칙 (그리기와 분리 — Node 시뮬레이션에서도 사용) ---------- */
export const BW = 120;           // 도트 버퍼 크기 (논리 무대 360×640 의 1/3)
export const BH = 214;
const GROUND = 168;              // 땅 높이 (버퍼 y)
const HX = 22;                   // 하초 x
const G = 620;                   // 중력 (px/s²)
const JUMP_V = 215;              // 점프 속도 → 최고 높이 ≈ 37px, 체공 ≈ 0.7초
const BUFFER = 0.12;             // 착지 직전에 누른 점프도 인정
const HIT_SLOW = 1.2;            // 부딪힌 뒤 느려지는 시간
const INVULN = 1.0;              // 부딪힌 뒤 무적 시간
export const COIN_RATE = 0.14;   // 보통 실력 ≈ 28코인 (시뮬레이션 기준)
export const PTS = { dist: 1 / 40, leaf: 2, gold: 5, comboMax: 5 }; // 콤보: 장애물 하나 넘을 때마다 min(콤보, 5)점

const OBST = {
  rock:     { w: 8,  h: 6, yb: 0,  p: 0.24 },
  log:      { w: 14, h: 6, yb: 0,  p: 0.2 },
  puddle:   { w: 16, h: 1, yb: 0,  p: 0.18 },
  mushroom: { w: 5,  h: 5, yb: 0,  p: 0.16 },
  bee:      { w: 8,  h: 6, yb: 19, p: 0.22 }, // 서 있는 하초(키 13) 위, 점프 높이에 떠 있음
};

export function createWorld(rnd = Math.random) {
  return {
    rnd, t: 0, dist: 0, speed: 0, h: 0, vh: 0, jumpBuf: 0,
    slow: 0, inv: 0, combo: 0, bestCombo: 0, hits: 0,
    obs: [], items: [], nextObs: 60, nextItem: 40,
    pts: { dist: 0, leaf: 0, combo: 0 }, got: { leaf: 0, gold: 0 },
    events: [],                   // 그리기용: { type, x, y, text }
  };
}
export const scoreOf = (w) => Math.floor(w.pts.dist + w.pts.leaf + w.pts.combo);

function pickObs(w) {
  let r = w.rnd();
  for (const [k, o] of Object.entries(OBST)) { if ((r -= o.p) < 0) return k; }
  return 'rock';
}

export function jump(w) { w.jumpBuf = BUFFER; }

export function step(w, dt) {
  w.t += dt;
  const base = 62 + w.t * 1.6;                                    // 점점 빨라짐
  const slowMul = w.slow > 0 ? 0.55 + 0.45 * (1 - w.slow / HIT_SLOW) : 1;
  w.speed = base * slowMul;
  const dx = w.speed * dt;
  w.dist += dx;
  w.pts.dist = w.dist * PTS.dist;
  w.slow = Math.max(0, w.slow - dt);
  w.inv = Math.max(0, w.inv - dt);

  // 점프
  w.jumpBuf = Math.max(0, w.jumpBuf - dt);
  if (w.jumpBuf > 0 && w.h === 0) { w.vh = JUMP_V; w.jumpBuf = 0; }
  if (w.h > 0 || w.vh > 0) {
    w.vh -= G * dt;
    w.h += w.vh * dt;
    if (w.h <= 0) { w.h = 0; w.vh = 0; }
  }

  // 생성
  w.nextObs -= dx;
  if (w.nextObs <= 0) {
    const type = pickObs(w);
    const o = OBST[type];
    w.obs.push({ type, x: BW + 4, w: o.w, h: o.h, yb: o.yb, done: false });
    // 다음 장애물까지 간격 (빨라질수록 조금 좁게)
    w.nextObs = 70 + w.rnd() * 70 - Math.min(18, w.t * 0.6) + (type === 'bee' ? 12 : 0);
    // 돌·통나무 위에는 가끔 잎 아치 (점프하면서 줍기)
    if ((type === 'rock' || type === 'log') && w.rnd() < 0.45) {
      const gold = w.rnd() < 0.3;
      [-6, 0, 6].forEach((ox, i) => w.items.push({ kind: gold && i === 1 ? 'gold' : 'leaf', x: BW + 4 + o.w / 2 + ox - 1, yb: i === 1 ? 30 : 24 }));
    }
  }
  w.nextItem -= dx;
  if (w.nextItem <= 0) {                                        // 땅 가까이 쉬운 잎
    w.items.push({ kind: w.rnd() < 0.12 ? 'gold' : 'leaf', x: BW + 4, yb: 3 + w.rnd() * 6 });
    w.nextItem = 45 + w.rnd() * 60;
  }

  // 하초 몸 상자 (발이 땅=0)
  const bx0 = HX + 3, bx1 = HX + 12, by0 = w.h, by1 = w.h + 13;
  for (const o of w.obs) {
    o.x -= dx;
    if (o.done) continue;
    const overlap = o.x < bx1 && o.x + o.w > bx0 && o.yb < by1 && o.yb + o.h > by0 + (o.type === 'puddle' ? 0 : 0.5);
    if (overlap && w.inv === 0) {
      o.done = true;
      w.hits++; w.combo = 0; w.slow = HIT_SLOW; w.inv = INVULN;
      w.events.push({ type: 'hit', x: HX + 7, y: GROUND - 20 - w.h, text: o.type === 'bee' ? '앗 벌!' : '쿵!' });
    } else if (o.x + o.w < bx0) {
      o.done = true;
      w.combo++;
      w.bestCombo = Math.max(w.bestCombo, w.combo);
      const add = Math.min(PTS.comboMax, w.combo);
      w.pts.combo += add;
      if (w.combo >= 2) w.events.push({ type: 'combo', x: HX + 7, y: GROUND - 26 - w.h, text: `콤보 ${w.combo}` });
    }
  }
  w.obs = w.obs.filter((o) => o.x + o.w > -10);

  for (const it of w.items) {
    it.x -= dx;
    if (it.taken) continue;
    if (it.x < bx1 && it.x + 3 > bx0 && it.yb < by1 && it.yb + 3 > by0) {
      it.taken = true;
      const p = it.kind === 'gold' ? PTS.gold : PTS.leaf;
      w.pts.leaf += p; w.got[it.kind]++;
      w.events.push({ type: 'item', x: it.x, y: GROUND - it.yb - 6, text: `+${p}` });
    }
  }
  w.items = w.items.filter((it) => !it.taken && it.x > -6);
}

/* ---------- 그리기 ---------- */
const TREE_COLS = { green: ['#3f9f4f', '#5cbf5c'], ginkgo: ['#f5b700', '#ffd23f'], cherry: ['#ff8fbf', '#ffc6de'] };

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function drawWorld(t, w, frame) {
  const { R, P, blob } = t;
  // 하늘
  ['#9fd8ff', '#ade0ff', '#bce6ff', '#cbecff', '#daf2ff'].forEach((c, i) => R(0, i * 24, BW, 24, c));
  R(0, 120, BW, GROUND - 120, '#e4f6ff');
  blob(98, 22, 6, '#fff3b0');                                        // 해
  // 구름 (가장 느림)
  const cOff = (w.dist * 0.08) % 200;
  [[20, 30], [90, 18], [150, 40], [210, 24]].forEach(([x, y]) => {
    const cx = ((x - cOff) % 200 + 200) % 200 - 30;
    blob(cx, y, 7, '#ffffff', 2); blob(cx + 5, y - 2, 5, '#ffffff', 2);
  });
  // 먼 산 (느림)
  const mOff = w.dist * 0.2;
  for (let x = 0; x < BW; x++) {
    const gx = x + mOff;
    const hgt = 22 + Math.sin(gx * 0.045) * 10 + Math.sin(gx * 0.11 + 1) * 5;
    R(x, GROUND - 22 - hgt, 1, hgt, '#a9c8e8');
    if (hgt > 28) P(x, GROUND - 22 - hgt, '#ffffff');
  }
  // 언덕
  const hOff = w.dist * 0.35;
  for (let x = 0; x < BW; x++) {
    const gx = x + hOff;
    const hgt = 10 + Math.sin(gx * 0.06) * 5;
    R(x, GROUND - 10 - hgt, 1, hgt + 10, '#9bd77f');
  }
  // 나무 (중간 속도, 가끔 은행나무·벚꽃나무)
  const tOff = w.dist * 0.6;
  const first = Math.floor(tOff / 34) - 1;
  for (let i = first; i < first + 6; i++) {
    const x = i * 34 - tOff + hash(i) * 14;
    const r = hash(i + 0.5);
    const kind = r < 0.2 ? 'ginkgo' : r < 0.38 ? 'cherry' : 'green';
    const [dark, light] = TREE_COLS[kind];
    const th = 10 + Math.floor(hash(i + 0.7) * 6);
    R(x, GROUND - th, 2, th, '#7a5236');
    blob(x + 1, GROUND - th - 5, 6, dark, 5);
    blob(x, GROUND - th - 7, 4, light, 3);
  }
  // 풀밭 (가장 빠름)
  R(0, GROUND, BW, BH - GROUND, '#8a5a3a');
  R(0, GROUND, BW, 6, '#6fbf4a');
  R(0, GROUND, BW, 1, '#8fd16a');
  const gOff = Math.floor(w.dist) % 8;
  for (let x = -gOff; x < BW; x += 8) { P(x, GROUND - 1, '#6fbf4a'); P(x + 3, GROUND - 1, '#8fd16a'); P(x + 5, GROUND + 9, '#7a4a2e'); }
  const sOff = Math.floor(w.dist) % 23;
  for (let x = -sOff; x < BW; x += 23) { P(x, GROUND + 16, '#a06a46'); P(x + 11, GROUND + 26, '#a06a46'); }

  // 잎
  for (const it of w.items) {
    const y = GROUND - it.yb - 3, x = Math.round(it.x);
    if (it.kind === 'gold') { R(x, y, 3, 1, '#ffd23f'); P(x + 1, y + 1, '#f5b700'); P(x + 1, y + 2, '#a0782a'); }
    else { P(x + 1, y, '#5cbf5c'); R(x, y + 1, 3, 1, '#5cbf5c'); P(x + 1, y + 2, '#3a8f3a'); }
  }
  // 장애물
  for (const o of w.obs) {
    const x = Math.round(o.x), y = GROUND - o.yb - o.h;
    if (o.type === 'rock') { blob(x + 4, GROUND - 3, 4, '#8a8f99', 3); P(x + 2, GROUND - 5, '#b5bac3'); P(x + 3, GROUND - 5, '#b5bac3'); }
    if (o.type === 'log') { R(x, y, 14, 6, '#8a5a3a'); R(x, y, 14, 1, '#a87048'); blob(x + 12, y + 3, 2, '#c99a6a', 2); P(x + 12, y + 3, '#8a5a3a'); }
    if (o.type === 'puddle') { R(x + 1, GROUND, 14, 2, '#5ab0e8'); R(x, GROUND, 16, 1, '#5ab0e8'); P(x + 4, GROUND, '#c9ecff'); P(x + 10, GROUND + 1, '#c9ecff'); }
    if (o.type === 'mushroom') { R(x + 2, y + 3, 1, 2, '#f3e6d0'); R(x, y + 1, 5, 2, '#e03131'); R(x + 1, y, 3, 1, '#e03131'); P(x + 1, y + 1, '#fff'); P(x + 3, y + 2, '#fff'); }
    if (o.type === 'bee') {
      const flap = frame % 8 < 4;
      R(x, y + 1, 8, 6, '#1e2630');                                  // 진한 테두리 (은행나무 앞에서도 보이게)
      R(x + 1, y + 2, 6, 4, '#ffd43b'); R(x + 3, y + 2, 1, 4, '#1e2630'); R(x + 5, y + 2, 1, 4, '#1e2630');
      P(x, y + 3, '#1e2630'); P(x + 1, y + 3, '#1e2630');
      R(x + 3, flap ? y : y + 1, 3, 2, '#ffffff');
    }
  }
  // 하초 (롤러스케이트)
  const blink = w.inv > 0 && Math.floor(w.inv * 12) % 2 === 0;
  t.c.save();
  if (blink) t.c.globalAlpha = 0.35;                                // 부딪힌 뒤 깜빡임 (사라지지는 않게)
  {
    const top = GROUND - 15 - Math.round(w.h);
    chara(t, 'hacho', HX, top, { armL: w.h > 0 ? 'high' : 'down', armR: w.h > 0 ? 'high' : 'side' });
    R(HX + 4, top + 13, 7, 1, '#ff6b6b');                             // 스케이트
    const spin = frame % 6 < 3;
    [5, 9].forEach((wx) => P(HX + wx, top + 14, spin ? '#3a3a3a' : '#6a6a6a'));
    P(HX + 7, top + 14, spin ? '#6a6a6a' : '#3a3a3a');
    if (w.h === 0 && frame % 4 < 2) P(HX + 2, GROUND - 1, '#dfe6f0');  // 먼지
  }
  t.c.restore();
}

let st = null;

export default {
  howTo: '톡 누르면 점프! 돌·통나무·웅덩이는 넘고<br>🐝 낮게 나는 벌은 점프하지 말고 그냥 지나가요<br><small>PC: Space · ↑</small>',

  start(api) {
    const { W, H } = api;
    const pr = api.pixelRatio;
    api.stage.innerHTML = '<canvas class="gcv"></canvas>';
    const cv = api.stage.querySelector('canvas');
    cv.width = W * pr; cv.height = H * pr;
    const c = cv.getContext('2d');
    const buf = document.createElement('canvas');
    buf.width = BW; buf.height = BH;
    const bc = buf.getContext('2d');
    const t = tools(bc, 99);
    const world = createWorld();
    st = { world, frame: 0, pops: [], hint: 3 };
    api.startTimer();
    api.setInfo('콤보 0');

    const doJump = () => jump(world);
    api.listen(cv, 'pointerdown', (e) => { e.preventDefault(); doJump(); });
    api.key(['Space', 'ArrowUp'], doJump);

    const SC = W / BW;                                                // 3
    api.onFrame((dt) => {
      step(world, dt);
      st.frame++;
      st.hint = Math.max(0, st.hint - dt);
      api.setScore(scoreOf(world));
      api.setInfo(`콤보 ${world.combo}`);
      for (const ev of world.events) st.pops.push({ x: ev.x * SC, y: ev.y * SC, t: 0.8, s: ev.text, bad: ev.type === 'hit' });
      world.events.length = 0;

      bc.clearRect(0, 0, BW, BH);
      drawWorld(t, world, st.frame);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.imageSmoothingEnabled = false;
      c.drawImage(buf, 0, 0, BW, BH, 0, 0, cv.width, cv.width * BH / BW);
      c.setTransform(pr, 0, 0, pr, 0, 0);
      c.textAlign = 'center';
      if (st.hint > 0) {
        c.globalAlpha = Math.min(1, st.hint);
        c.fillStyle = '#ffffff'; c.font = '26px Jua, sans-serif';
        c.fillText('톡 = 점프!', W / 2, GROUND * SC + 110);
        c.globalAlpha = 1;
      }
      st.pops = st.pops.filter((p) => {
        p.t -= dt; p.y -= 40 * dt;
        c.globalAlpha = Math.max(0, p.t / 0.8);
        c.font = '24px Jua, sans-serif';
        c.lineWidth = 4; c.strokeStyle = '#ffffff';
        c.strokeText(p.s, p.x, p.y);
        c.fillStyle = p.bad ? '#e8590c' : '#2b7bb9';
        c.fillText(p.s, p.x, p.y);
        c.globalAlpha = 1;
        return p.t > 0;
      });
    });
  },

  coins(api) { return api.score * COIN_RATE; },

  finish() {
    const w = st.world;
    return { msg: `${Math.floor(w.dist / 10)}m 달렸어요! 🍃${w.got.leaf} 🍂${w.got.gold} · 최고 콤보 ${w.bestCombo}${w.hits ? ` · 쿵 ${w.hits}번` : ''}` };
  },

  cleanup() { st = null; },
};
