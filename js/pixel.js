// 추억조각 도트 장면 (64×48). 장면마다 함수 하나 — 나중에 PNG로 바꿀 때 SCENES[id]만 교체하면 된다.
// 화면에 들어간 <canvas data-scene>은 자동으로 그려지고, 가능한 한 정수 배율로 확대된다.

export const W = 64;
export const H = 48;

/* =========================================================
   도구
   ========================================================= */
function tools(c, seed = 7) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const P = (x, y, col) => R(x, y, 1, 1, col);
  // 타원 덩어리 (나무 수관, 구름 등)
  const blob = (cx, cy, rx, col, ry = rx) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx + 0.6) + (y * y) / (ry * ry + 0.6) <= 1) P(cx + x, cy + y, col);
    }
  };
  // 덩어리 안에 무작위 점 (질감)
  const speckle = (cx, cy, rx, ry, n, cols) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      P(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, cols[(rnd() * cols.length) | 0]);
    }
  };
  const scatter = (x0, y0, w, h, n, cols) => {
    for (let i = 0; i < n; i++) P(x0 + rnd() * w, y0 + rnd() * h, cols[(rnd() * cols.length) | 0]);
  };
  const alpha = (a, fn) => { c.save(); c.globalAlpha = a; fn(); c.restore(); };
  return { c, R, P, blob, speckle, scatter, rnd, alpha };
}

/* =========================================================
   도트 하초 · 두나 (15칸 폭)
   ========================================================= */
const PAL = {
  g: '#5cbf5c',                       // 잎
  B: '#4a9fd6', b: '#8fd3ff',         // 하초 테두리 · 몸
  O: '#8a5427', d: '#c98a4b', c: '#a86a34', // 두나 테두리 · 몸 · 곱슬
  k: '#1e2630', r: '#ff6b81', y: '#ffd23f',
};
const LIMB = '#2b3a4a';

const HACHO = [
  '...g.g.g.g.g...',
  '...g.g.g.g.g...',
  '....gBBBBBg....',
  '...BBbbbbbBB...',
  '..BbbbbbbbbbB..',
  '..BbbkbbbkbbB..',
  '..BbbbbbbbbbB..',
  '..BbbbrrrbbbB..',
  '..BbbbbrbbbbB..',
  '...BBbbbbbBB...',
  '.....BBBBB.....',
];
const DUNA = [
  '...............',
  '......O.O......',
  '...O.OOOOO.O...',
  '...OOddcddOO...',
  '.OOddcddddddOO.',
  '..OddkdddkddO..',
  '..OddddyyddcO..',
  '..OddddyyyddO..',
  '..OcdddyydddO..',
  '..OOOdddcdOOO..',
  '.....OOOOO.....',
];
// 팔: 몸 옆(x=1, 13)에서 바깥으로. 왼팔 좌표, 오른팔은 좌우 반전.
const ARMS = {
  up:   [[1, 6], [0, 5]],
  high: [[1, 5], [1, 4], [0, 3]],
  side: [[1, 7], [0, 7]],
  down: [[1, 7], [0, 8]],
  // 두나 날개 팔 < >
  wing: [[1, 6], [0, 7], [1, 8]],
  wingUp: [[1, 6], [0, 5], [0, 4]],
  wingSide: [[1, 6], [0, 6]],
};
const LEGS = {
  hacho: { stand: [[6, 11], [6, 12], [6, 13], [8, 11], [8, 12], [8, 13]], walk: [[6, 11], [5, 12], [4, 13], [8, 11], [9, 12], [10, 13]] },
  duna:  { stand: [[6, 11], [6, 12], [8, 11], [8, 12]], walk: [[6, 11], [5, 12], [8, 11], [9, 12]] },
};

/**
 * @param {object} t tools
 * @param {'hacho'|'duna'} who
 * @param {number} x 왼쪽 위 (15×14 칸)
 * @param {object} o { back, armL, armR, legs, crown, web, hula, holdL, holdR }
 */
function chara(t, who, x, y, o = {}) {
  const rows = who === 'hacho' ? HACHO : DUNA;
  const defArm = who === 'hacho' ? 'up' : 'wing';
  const armL = ARMS[o.armL || defArm], armR = ARMS[o.armR || defArm];
  armL.forEach(([ax, ay]) => t.P(x + ax, y + ay, LIMB));
  armR.forEach(([ax, ay]) => t.P(x + 14 - ax, y + ay, LIMB));
  LEGS[who][o.legs || 'stand'].forEach(([lx, ly]) => t.P(x + lx, y + ly, LIMB));
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      let ch = row[i];
      if (o.back && 'kry'.includes(ch)) ch = who === 'hacho' ? 'b' : 'd'; // 뒷모습: 얼굴 없음
      const col = PAL[ch];
      if (col) t.P(x + i, y + j, col);
    }
  });
  if (o.hula) {
    for (let i = 3; i <= 11; i++) {
      const col = i % 2 ? '#3f9f3f' : '#6fcf5f';
      t.P(x + i, y + 9, col); t.P(x + i, y + 10, col);
      if (i !== 6 && i !== 8) t.P(x + i, y + 11, col);
    }
    t.P(x + 11, y + 1, '#ff6f91'); t.P(x + 12, y + 1, '#ff6f91'); t.P(x + 11, y + 2, '#ff6f91'); // 머리 꽃
  }
  if (o.crown) {
    const Y = '#ffd23f';
    [5, 7, 9].forEach((cx) => t.P(x + cx, y - 1, Y));
    t.R(x + 5, y, 5, 2, Y);
    t.P(x + 7, y + 1, '#ff5a7a');
    t.P(x + 5, y + 1, '#4dabf7'); t.P(x + 9, y + 1, '#4dabf7');
  }
  if (o.web) {
    const Wc = '#eef1f5';
    [[2, -1], [3, 0], [4, 1], [12, -1], [11, 0], [10, 1], [4, 0], [6, 0], [8, 0], [10, 0], [5, -1], [7, -1], [9, -1], [7, -2]].forEach(([wx, wy]) => t.P(x + wx, y + wy, Wc));
    t.P(x + 12, y - 2, '#d0d4da'); t.P(x + 12, y - 3, '#d0d4da'); t.P(x + 12, y + 0, '#3a3a3a'); // 매달린 거미
  }
  const leaf = (lx, ly) => { t.R(lx - 1, ly, 3, 1, '#ffd23f'); t.P(lx, ly + 1, '#f5b700'); t.P(lx, ly + 2, '#a0782a'); };
  if (o.holdR) leaf(x + 14, y + 2);
  if (o.holdL) leaf(x, y + 1);
}

// 멀리 있는 작은 두나 (5칸)
function miniDuna(t, x, y, step = 0) {
  ['.OOO.', 'OkdkO', 'OddyO', '.OOO.'].forEach((row, j) => {
    for (let i = 0; i < 5; i++) { const col = PAL[row[i]]; if (col) t.P(x + i, y + j, col); }
  });
  t.P(x + 1 - step, y + 4, LIMB); t.P(x + 3 + step, y + 4, LIMB);
}

/* =========================================================
   배경 소품
   ========================================================= */
function cloud(t, x, y, w = 8) {
  t.blob(x, y, w / 2, '#ffffff', 2); t.blob(x + w / 3, y - 2, w / 3, '#ffffff', 2);
}
function cherryTree(t, x, ground, size = 7) {
  t.R(x, ground - size - 4, 2, size + 4, '#7a4a3a');
  t.blob(x + 1, ground - size - 6, size, '#ffb7d5', Math.round(size * 0.8));
  t.speckle(x + 1, ground - size - 6, size, size * 0.8, size * 6, ['#ff8fbf', '#ffd1e4', '#ffc6de']);
}
function grassTufts(t, y0, h, n, col) {
  for (let i = 0; i < n; i++) { const x = t.rnd() * 64, y = y0 + t.rnd() * h; t.P(x, y, col); t.P(x + 1, y - 1, col); }
}

/* =========================================================
   장면 13개
   ========================================================= */
export const SCENES = {
  // 🌸 벚꽃나무 3그루, 하초와 두나가 같이 서 있음 — 성북천
  blossom(t) {
    t.R(0, 0, W, 26, '#dff2ff');
    cloud(t, 20, 6, 10); cloud(t, 46, 4, 8);
    t.R(0, 25, W, 4, '#b8e48a');
    t.R(0, 29, W, 3, '#6fbbe8');                      // 천
    t.scatter(0, 29, W, 3, 14, ['#bfe6ff']);
    t.R(0, 32, W, 16, '#a8dc7a');
    grassTufts(t, 34, 13, 18, '#8cc960');
    cherryTree(t, 31, 26, 5);                          // 멀리
    cherryTree(t, 6, 34, 8);
    cherryTree(t, 56, 34, 8);
    chara(t, 'hacho', 17, 31);
    chara(t, 'duna', 32, 32);
    t.scatter(0, 0, W, 46, 22, ['#ff8fbf', '#ffc6de']);  // 꽃잎
  },

  // 🎫 공연장, 뒷모습, 무대 조명
  ticket(t) {
    t.R(0, 0, W, H, '#1f1838');
    t.R(0, 2, W, 18, '#3b2a5c');
    for (let x = 2; x < W; x += 5) t.R(x, 2, 1, 18, '#4a3570');   // 커튼 주름
    t.R(0, 1, W, 1, '#6b6b7a');
    const lamps = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#d0bfff'];
    [8, 20, 32, 44, 56].forEach((lx, i) => t.R(lx - 1, 2, 3, 1, lamps[i]));
    t.alpha(0.28, () => {                                // 조명 기둥
      [[20, '#fff3bf'], [32, '#ffe8f3'], [44, '#d0ebff']].forEach(([lx, col]) => {
        for (let yy = 3; yy < 24; yy++) { const w = 1 + (yy - 3) * 0.45; t.R(lx - w, yy, w * 2 + 1, 1, col); }
      });
    });
    t.R(4, 20, 56, 4, '#6b4a2a'); t.R(4, 20, 56, 1, '#a07850');   // 무대
    t.R(31, 13, 3, 7, '#0f0b1c'); t.blob(32, 12, 1, '#0f0b1c');    // 공연하는 사람
    t.P(30, 14, '#c0c0c0'); t.P(30, 15, '#c0c0c0');
    ['#ffe27a', '#ffd1e4'].forEach((col, i) => { t.P(16 + i * 30, 9, col); t.P(17 + i * 30, 8, col); t.R(17 + i * 30, 8, 1, 3, col); });
    for (let x = 2; x < W; x += 6) t.blob(x, 30, 2, '#2a2246');    // 관객 머리
    chara(t, 'hacho', 17, 32, { back: true, armR: 'high' });
    chara(t, 'duna', 32, 33, { back: true, armL: 'wingUp' });
    t.R(31, 32, 1, 3, '#ffe066'); t.P(31, 31, '#fff3bf');          // 응원봉 (하초 오른손)
  },

  // 🍂 커다란 노란 은행나무 아래, 은행잎을 하나씩 든 하초와 두나
  ginkgo(t) {
    t.R(0, 0, W, H, '#bfe6ff');
    t.R(0, 36, W, 12, '#f2d36b');
    t.R(29, 12, 6, 25, '#8a5a3a'); t.R(27, 35, 10, 2, '#8a5a3a'); t.R(31, 14, 1, 20, '#a87048');
    t.blob(32, 11, 21, '#ffd23f', 11);
    t.blob(14, 17, 9, '#ffd23f', 6); t.blob(50, 17, 9, '#ffd23f', 6);
    t.speckle(32, 12, 26, 12, 120, ['#f5b700', '#ffe066', '#f0a500']);
    t.scatter(0, 36, W, 12, 40, ['#f5b700', '#ffe066', '#e0a000']);
    t.scatter(0, 22, W, 14, 10, ['#f5b700']);
    chara(t, 'hacho', 10, 32, { holdR: true });
    chara(t, 'duna', 38, 33, { armL: 'wingUp', holdL: true });
  },

  // ❄️ 어두운 저녁, 눈 덮인 땅, 마주 보고 춤추는 하초와 두나
  snow(t) {
    ['#3d4560', '#464e6b', '#4f5777', '#5a6283', '#666d8d'].forEach((col, i) => t.R(0, i * 8, W, 8, col));
    t.blob(10, 38, 16, '#dfe6f0', 4); t.blob(54, 37, 16, '#dfe6f0', 4);
    t.R(0, 38, W, 10, '#eef2f8');
    t.scatter(0, 39, W, 9, 20, ['#d5ddea']);
    t.R(55, 16, 1, 22, '#2b2f3a'); t.R(53, 13, 5, 3, '#ffe8a3');      // 가로등
    t.alpha(0.18, () => t.blob(55, 15, 7, '#ffe8a3'));
    chara(t, 'hacho', 14, 31, { armR: 'high', armL: 'down' });
    chara(t, 'duna', 33, 32, { armL: 'wingUp', armR: 'wing' });
    [[30, 27], [27, 29], [36, 28]].forEach(([x, y]) => { t.P(x, y, '#ffd1e4'); });  // 반짝
    t.scatter(0, 0, W, 46, 70, ['#ffffff', '#e8eef8']);
  },

  // 💜 오른쪽에 커다란 보라색 라벤더 나무, 그 아래 하초
  lavender(t) {
    ['#dcd6ff', '#e4dfff', '#ece9ff', '#f3f1ff'].forEach((col, i) => t.R(0, i * 9, W, 9, col));
    t.R(0, 36, W, 12, '#9fd486');
    for (let i = 0; i < 16; i++) { const x = (t.rnd() * 64) | 0, y = 37 + ((t.rnd() * 9) | 0); t.R(x, y, 1, 3, '#7a9f5a'); t.P(x, y - 1, '#9775fa'); t.P(x, y, '#b197fc'); }
    t.R(48, 16, 3, 21, '#6b4a3a'); t.R(46, 34, 7, 2, '#6b4a3a');
    t.blob(48, 13, 15, '#b197fc', 12); t.blob(58, 21, 8, '#b197fc', 8); t.blob(39, 20, 8, '#b197fc', 6);
    t.speckle(49, 15, 18, 13, 140, ['#9775fa', '#d0bfff', '#7048e8', '#e5dbff']);
    chara(t, 'hacho', 18, 31, { armR: 'high' });
    [[33, 28], [34, 27], [35, 28], [36, 27], [34, 25], [35, 24]].forEach(([x, y]) => t.P(x, y, '#9775fa')); // 킁카 향기
    t.scatter(0, 0, 44, 36, 10, ['#b197fc']);
  },

  // 🌺 하초와 두나가 훌라춤
  hula(t) {
    t.R(0, 0, W, 24, '#a8e2ff'); t.R(0, 0, W, 8, '#8fd8ff');
    t.blob(54, 7, 4, '#ffd166');
    t.R(0, 24, W, 8, '#3fb0e8'); t.scatter(0, 24, W, 8, 16, ['#bfe9ff']);
    t.R(0, 32, W, 16, '#f6e3b4'); t.scatter(0, 33, W, 15, 12, ['#ead39a']);
    for (let i = 0; i < 26; i++) t.P(6 + Math.round(Math.sin(i / 8) * 2) + i * 0.1, 40 - i, '#a06a3a');   // 야자나무
    [[-6, 2], [-5, 4], [5, 3], [6, 1], [-3, -2], [3, -2]].forEach(([dx, dy]) => {
      for (let k = 0; k <= 5; k++) t.P(9 + Math.round(dx * k / 5), 14 + Math.round(dy * k / 5) + (k > 3 ? 1 : 0), '#2f9e44');
    });
    chara(t, 'hacho', 17, 30, { hula: true, armL: 'high', armR: 'side' });
    chara(t, 'duna', 34, 31, { hula: true, armL: 'wingSide', armR: 'wingUp' });
    [[14, 22], [50, 26], [30, 20]].forEach(([x, y]) => { t.P(x, y, '#ff6f91'); t.P(x + 1, y, '#ffd43b'); });
  },

  // 🪴 화분에 심긴 초록이
  pot(t) {
    t.R(0, 0, W, H, '#fdf3e3');
    t.R(6, 3, 26, 20, '#c9a77a'); t.R(8, 5, 22, 16, '#cdeeff'); t.R(18, 5, 2, 16, '#c9a77a'); t.R(8, 12, 22, 2, '#c9a77a');
    cloud(t, 13, 9, 6);
    t.R(0, 38, W, 10, '#c48a5a'); t.R(0, 38, W, 1, '#a06a3a');
    // 초록이: 하초 잎처럼 5장
    t.R(31, 18, 2, 12, '#3a8f3a');
    [[22, 17, -1], [26, 12, -1], [32, 9, 0], [38, 12, 1], [42, 17, 1]].forEach(([x, y, d]) => {
      t.blob(x, y, 3, '#5cbf5c', 5); t.R(x - d, y - 3, 1, 6, '#3a8f3a');
      for (let k = 0; k < 4; k++) t.P(x + (32 - x) * k / 4, y + 5 + (25 - y) * k / 8, '#3a8f3a');
    });
    t.R(23, 27, 19, 3, '#c25e36');                  // 화분
    for (let y = 30; y < 39; y++) { const w = 15 - (y - 30) * 0.4; t.R(32.5 - w / 2, y, w, 1, '#d9744a'); }
    t.R(27, 32, 2, 4, '#e8946a');
    t.R(48, 33, 9, 5, '#7cc4f0'); t.R(57, 32, 3, 1, '#7cc4f0'); t.R(47, 31, 1, 3, '#7cc4f0'); t.R(50, 31, 4, 2, '#5aaee0'); // 물뿌리개
    [[18, 8], [46, 6], [50, 14]].forEach(([x, y]) => { t.P(x, y, '#ffd43b'); t.P(x - 1, y, '#ffe27a'); t.P(x + 1, y, '#ffe27a'); t.P(x, y - 1, '#ffe27a'); t.P(x, y + 1, '#ffe27a'); });
  },

  // 🍓 잼 병
  jam(t) {
    t.R(0, 0, W, 34, '#fff4e6');
    for (let x = 0; x < W; x += 8) t.R(x, 0, 1, 34, '#f3e2cc');
    for (let y = 0; y < 34; y += 8) t.R(0, y, W, 1, '#f3e2cc');
    t.R(0, 34, W, 14, '#e9b98a'); t.R(0, 34, W, 1, '#c9965f');
    t.R(22, 15, 20, 26, '#cfe3ee');                  // 유리병
    t.R(23, 18, 18, 22, '#d6336c'); t.R(24, 19, 3, 16, '#ff6b9a');
    t.R(21, 40, 22, 1, '#9fb8c8'); t.R(22, 14, 20, 1, '#9fb8c8');
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) t.R(20 + i * 2, 9 + j * 2, 2, 2, (i + j) % 2 ? '#ff6b6b' : '#ffffff'); // 체크 천
    t.R(21, 13, 22, 1, '#c92a2a'); t.P(43, 14, '#c92a2a'); t.P(44, 15, '#c92a2a');
    t.R(26, 24, 12, 9, '#fff8e1');                   // 라벨
    t.blob(32, 29, 2, '#e03131'); t.R(31, 26, 3, 1, '#2f9e44'); t.P(31, 29, '#ffd43b'); t.P(33, 30, '#ffd43b');
    const berry = (x, y) => { t.blob(x, y, 2, '#e03131'); t.R(x - 1, y - 3, 3, 1, '#2f9e44'); t.P(x, y - 4, '#2f9e44'); t.P(x - 1, y, '#ffd43b'); t.P(x + 1, y + 1, '#ffd43b'); };
    berry(11, 40); berry(15, 43); berry(52, 41);
    t.R(47, 33, 1, 9, '#c0c8d0'); t.blob(47, 31, 1, '#c0c8d0', 2);   // 숟가락
  },

  // 🍃🍞 단풍나무, 길, 길을 걷는 하초와 두나 — 긴 풀빵길
  bread(t) {
    t.R(0, 0, W, H, '#d7efff');
    cloud(t, 14, 6, 10);
    t.blob(22, 30, 30, '#b5e08f', 6);
    t.R(0, 28, W, 20, '#a8dc7a');
    for (let y = 26; y < H; y++) {                     // 멀어지는 길
      const k = (y - 26) / 22, cx = 40 - k * 16, w = 3 + k * 20;
      t.R(cx - w / 2, y, w, 1, '#ead6ab');
      if (y % 3 === 0) { t.R(cx - w / 2 - 2, y, 2, 1, '#c98a3a'); t.R(cx + w / 2, y, 2, 1, '#c98a3a'); } // 길가 풀빵
    }
    t.R(52, 8, 3, 24, '#7a4a2a');
    t.blob(53, 8, 11, '#e8590c', 9); t.blob(44, 14, 6, '#ff922b', 5);
    t.speckle(51, 9, 13, 10, 80, ['#d9480f', '#ffa94d', '#ff6b1a']);
    chara(t, 'hacho', 15, 32, { legs: 'walk', armL: 'down', armR: 'side' });
    chara(t, 'duna', 29, 33, { legs: 'walk', armL: 'wingSide' });
    t.scatter(26, 10, 38, 34, 12, ['#e8590c', '#ffa94d']);
  },

  // 🎄 크리스마스 트리 아래 하초
  tree(t) {
    t.R(0, 0, W, H, '#f5e6cf');
    t.R(4, 5, 16, 15, '#a07850'); t.R(6, 7, 12, 11, '#2b3a67'); t.R(11, 7, 2, 11, '#a07850'); t.R(6, 11, 12, 2, '#a07850');
    t.scatter(6, 7, 12, 11, 10, ['#ffffff']);
    t.R(0, 39, W, 9, '#c48a5a'); for (let x = 0; x < W; x += 10) t.R(x, 39, 1, 9, '#a87048');
    for (let y = 7; y < 37; y++) {                     // 트리 3단
      const yy = y < 17 ? y - 7 : y < 27 ? y - 15 : y - 23;
      const w = 2 + yy * 1.3;
      t.R(43 - w / 2, y, w, 1, y % 4 === 0 ? '#237a39' : '#2f8f46');
    }
    t.R(41, 37, 5, 3, '#7a4a2a');
    t.P(43, 4, '#ffd43b'); t.R(42, 5, 3, 1, '#ffd43b'); t.P(43, 6, '#ffd43b'); t.P(41, 4, '#ffe27a'); t.P(45, 4, '#ffe27a');
    t.speckle(43, 24, 9, 12, 26, ['#ff6b6b', '#ffd43b', '#4dabf7', '#ffffff']);
    t.R(29, 33, 8, 6, '#ff6b6b'); t.R(32, 33, 2, 6, '#ffd43b'); t.R(29, 35, 8, 1, '#ffd43b');
    t.R(51, 34, 9, 5, '#4dabf7'); t.R(55, 34, 1, 5, '#ffffff'); t.R(51, 36, 9, 1, '#ffffff');
    chara(t, 'hacho', 12, 26, { armL: 'high', armR: 'up' });
  },

  // ⏳ 오래 기다려서 머리에 거미줄 앉은 하초, 저 멀리서 걸어오는 두나
  hourglass(t) {
    t.R(0, 0, W, 28, '#d8ecff');
    cloud(t, 44, 6, 10);
    t.blob(48, 28, 20, '#c6e8a2', 3);
    t.R(0, 27, W, 21, '#b5e08f');
    for (let y = 26; y < H; y++) { const k = (y - 26) / 22, cx = 50 - k * 26, w = 2 + k * 16; t.R(cx - w / 2, y, w, 1, '#ead6ab'); }
    miniDuna(t, 47, 21, 0);
    t.P(53, 22, '#9aa9b8'); t.P(54, 21, '#9aa9b8');   // 걸어오는 표시
    chara(t, 'hacho', 5, 31, { web: true, armL: 'down', armR: 'down' });
    // 모래시계
    t.R(22, 32, 7, 1, '#8a5a3a'); t.R(22, 44, 7, 1, '#8a5a3a');
    for (let i = 0; i < 5; i++) { t.R(23 + i * 0.5, 33 + i, 5 - i, 1, '#e6f4ff'); t.R(23 + i * 0.5, 43 - i, 5 - i, 1, '#e6f4ff'); }
    t.R(24, 41, 3, 2, '#f2c94c'); t.R(23, 43, 5, 1, '#f2c94c'); t.P(25, 38, '#f2c94c');
    [[3, 26], [21, 26], [26, 28]].forEach(([x, y]) => t.P(x, y, '#9aa9b8'));
  },

  // 🎂 가운데 하초, 머리에 왕관, 생일 축하 (케이크·촛불·꽃가루)
  cake(t) {
    t.R(0, 0, W, H, '#fff0f6');
    const flags = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
    for (let i = 0; i < 9; i++) {                      // 가랜드
      const x = 2 + i * 7, col = flags[i % 5];
      t.R(x, 3, 5, 1, col); t.R(x + 1, 4, 3, 1, col); t.P(x + 2, 5, col);
    }
    t.R(0, 2, W, 1, '#c9a0b4');
    t.R(0, 38, W, 10, '#ffd8a8'); t.R(0, 38, W, 1, '#f0b87a');
    t.blob(6, 10, 3, '#ff6b6b', 4); t.R(6, 14, 1, 8, '#c0a0b0');   // 풍선
    t.blob(58, 12, 3, '#4dabf7', 4); t.R(58, 16, 1, 8, '#c0a0b0');
    chara(t, 'hacho', 24, 24, { crown: true, armL: 'high', armR: 'high' });
    t.R(44, 32, 15, 7, '#fff'); t.R(44, 32, 15, 2, '#ff8fb1');      // 케이크
    for (let x = 45; x < 59; x += 3) t.P(x, 34, '#ff8fb1');
    t.R(46, 28, 11, 4, '#ffe3ec'); t.R(46, 28, 11, 1, '#ff8fb1');
    [48, 51, 54].forEach((x) => { t.R(x, 24, 1, 4, '#74c0fc'); t.P(x, 23, '#ffd43b'); t.P(x, 22, '#ff922b'); });
    t.R(6, 33, 9, 6, '#b197fc'); t.R(10, 33, 1, 6, '#fff'); t.R(6, 35, 9, 1, '#fff');   // 선물
    t.scatter(0, 6, W, 32, 40, ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#ff8fb1']);
  },

  // 🌈 커다란 무지개, 그 아래 손잡고 웃는 하초와 두나
  rainbow(t) {
    t.R(0, 0, W, H, '#cfefff');
    ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'].forEach((col, k) => {
      const R = 30 - k * 2;
      for (let y = -R; y <= 0; y++) for (let x = -R; x <= R; x++) {
        const d = Math.hypot(x, y);
        if (d <= R && d > R - 2) t.P(32 + x, 42 + y, col);
      }
    });
    cloud(t, 4, 40, 10); cloud(t, 60, 40, 10);
    t.blob(32, 47, 40, '#8fd16a', 7);
    t.R(0, 42, W, 6, '#8fd16a');
    t.scatter(0, 43, W, 5, 10, ['#ffffff', '#ffd43b']);
    chara(t, 'hacho', 16, 28, { armR: 'side', armL: 'up' });
    chara(t, 'duna', 31, 29, { armL: 'wingSide', armR: 'wingUp' });
    t.R(30, 35, 2, 1, LIMB);                           // 맞잡은 손
    const heart = (x, y, col) => { t.P(x, y, col); t.P(x + 2, y, col); t.R(x, y + 1, 3, 1, col); t.P(x + 1, y + 2, col); };
    heart(30, 22, '#ff6b9a'); heart(24, 25, '#ff8fb1'); heart(37, 24, '#ff8fb1');
  },
};

// 시드는 장면마다 고정 → 매번 같은 그림
const SEEDS = Object.fromEntries(Object.keys(SCENES).map((k, i) => [k, 1234 + i * 977]));

/** 캔버스 하나에 장면을 그린다 */
export function drawScene(canvas, id) {
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, W, H);
  const f = SCENES[id];
  if (f) f(tools(c, SEEDS[id]));
  canvas.dataset.painted = id;
}

/** 액자 안에 들어갈 도트 장면 HTML */
export function sceneHTML(id, label = '') {
  return `<div class="pix-box"><canvas class="pix" data-scene="${id}" width="${W}" height="${H}" role="img" aria-label="${label}"></canvas></div>`;
}

/* ---------- 자동으로 그리고, 정수 배율로 맞추기 ---------- */
function fit(box) {
  const cv = box.querySelector('canvas.pix');
  if (!cv) return;
  // 정수 배율로 칸을 거의(88% 이상) 채울 수 있으면 정수 배율, 아니면 칸에 꽉 채우고 pixelated 로 확대
  const w = box.clientWidth;
  const k = Math.floor(w / W);
  cv.style.width = k >= 1 && (k * W) / w >= 0.88 ? `${k * W}px` : '100%';
}

let ro = null;
function paintIn(root) {
  root.querySelectorAll('canvas[data-scene]').forEach((cv) => {
    if (cv.dataset.painted !== cv.dataset.scene) drawScene(cv, cv.dataset.scene);
  });
  root.querySelectorAll('.pix-box').forEach((box) => {
    if (box.dataset.fit) return;
    box.dataset.fit = '1';
    fit(box);
    if (ro) ro.observe(box);
  });
}

/** 앱 시작 시 한 번 호출: 이후 DOM에 들어오는 장면 캔버스를 자동으로 그린다 */
export function autoPaintScenes(root = document.body) {
  if ('ResizeObserver' in window) ro = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
  paintIn(root);
  new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) paintIn(n.parentNode || n);
  }).observe(root, { childList: true, subtree: true });
}
