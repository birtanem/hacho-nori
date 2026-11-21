// 하초 SVG(+꾸미기 레이어)와 두나 SVG.
// 좌표계: 초안과 같은 몸 좌표(몸 중심 100,120 · 반지름 55)에
//         아이템이 잘리지 않게 사방 20씩 여백을 둔 viewBox(-20 -20 240 270).
// 그리는 순서: 배경 → 팔다리 → 잎 → 몸 → 옷 → 소품 → 얼굴 → 머리 → 손 → 발

const VB = '-20 -20 240 270';
const INK = '#2b3a4a';
const EYE = '#1e2630';

let uid = 0; // 한 페이지에 SVG가 여러 개 있어도 clipPath/gradient id가 겹치지 않게

/* ---------- 도우미 ---------- */
function star(cx, cy, R, r = R * 0.45) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * q).toFixed(1) + ' ' + (cy + Math.sin(a) * q).toFixed(1);
  }
  return d + 'Z';
}
const dots = (pts, r, fill, extra = '') =>
  pts.map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr ?? r}" fill="${fill}" ${extra}/>`).join('');

/* ---------- 공통 몸 ---------- */
const LIMB_LINES = `<line x1="47" y1="122" x2="18" y2="98"/><line x1="153" y1="122" x2="182" y2="98"/>
  <line x1="84" y1="171" x2="78" y2="208"/><line x1="116" y1="171" x2="122" y2="208"/>`;
const LIMB_HALO = `<g stroke="#fff" stroke-opacity=".75" stroke-width="9" stroke-linecap="round">${LIMB_LINES}</g>`;
const LIMBS = `<g stroke="${INK}" stroke-width="4.5" stroke-linecap="round">
  <line x1="47" y1="122" x2="18" y2="98"/><line x1="153" y1="122" x2="182" y2="98"/>
  <line x1="84" y1="171" x2="78" y2="208"/><line x1="116" y1="171" x2="122" y2="208"/></g>`;

// [잎 밑동 x, 밑동 y, 기울기°] — 양 끝 잎은 몸 원 둘레에 밑동이 닿도록 아래·바깥으로
const LEAF_POS = [[70, 79, -38], [84, 70, -13], [100, 70, 0], [116, 70, 13], [130, 79, 38]];
const LEAVES = LEAF_POS.map(([x, y, a]) =>
  `<ellipse cx="${x}" cy="${y - 16}" rx="7.5" ry="14" fill="#5cbf5c" stroke="#3a8f3a" stroke-width="2.5" transform="rotate(${a} ${x} ${y})"/>`).join('');

const EYES = `<circle cx="82" cy="112" r="5.5" fill="${EYE}"/><circle cx="118" cy="112" r="5.5" fill="${EYE}"/>`;
const MOUTH = `<path d="M88 128 H112 L100 145 Z" fill="#ff6b81" stroke="${EYE}" stroke-width="3" stroke-linejoin="round"/>`;

/* ---------- 배경 ---------- */
const BG_BOX = 'x="-20" y="-20" width="240" height="270" rx="22"';
const bgRect = (fill) => `<rect ${BG_BOX} fill="${fill}"/>`;

const BG = {
  bg_spring: (id) => `
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dcff"/><stop offset="1" stop-color="#eaf7ff"/></linearGradient></defs>
    ${bgRect(`url(#${id}g)`)}
    <g fill="#fff"><ellipse cx="150" cy="6" rx="18" ry="8"/><ellipse cx="164" cy="0" rx="12" ry="9"/><ellipse cx="60" cy="120" rx="14" ry="6"/><ellipse cx="190" cy="104" rx="16" ry="7"/></g>
    <path d="M-20 4 Q10 -2 40 -12 M10 0 Q22 14 38 18" stroke="#8a5a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M220 44 Q196 34 170 40" stroke="#8a5a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${dots([[-8, 2, 9], [8, -8, 8], [26, -12, 8], [38, 18, 7], [22, 10, 6], [214, 40, 9], [194, 34, 8], [174, 42, 7]], 8, '#ffc4dc')}
    ${dots([[-2, 0], [14, -6], [30, -10], [36, 16], [206, 38], [186, 36]], 2.5, '#ff8fbf')}
    <path d="M-20 212 Q60 200 120 210 T220 206 V250 H-20 Z" fill="#9fd977"/>
    ${dots([[10, 228], [40, 238], [160, 230], [196, 240], [70, 244]], 3, '#fff')}${dots([[10, 228], [40, 238], [160, 230], [196, 240], [70, 244]], 1.3, '#ffd43b')}
    ${[[50, 150], [160, 140], [20, 190], [185, 175], [120, 30], [70, 40]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#ffb7d5" transform="rotate(30 ${x} ${y})"/>`).join('')}`,

  bg_star: () => `
    ${bgRect('#1b2350')}
    ${dots([[5, 10], [40, 30], [20, 70], [190, 80], [160, 0], [205, 140], [-5, 150], [70, -5], [130, 20], [200, 30], [10, 180], [195, 190], [45, 120]], 1.8, '#fff')}
    ${[[30, 5], [180, 110], [-2, 95]].map(([x, y]) => `<path d="${star(x, y, 6, 2)}" fill="#ffe27a"/>`).join('')}
    <circle cx="172" cy="18" r="16" fill="#fff3b0"/><circle cx="180" cy="12" r="14" fill="#1b2350"/>
    <ellipse cx="100" cy="262" rx="170" ry="52" fill="#2d4a3a"/>`,

  bg_xmas: () => `
    ${bgRect('#23395b')}
    ${dots([[10, 40], [60, 10], [150, 30], [200, 70], [30, 120], [190, 150], [120, -5], [-8, 80], [170, 200]], 2.2, '#fff', 'opacity=".9"')}
    <path d="M-20 4 Q100 44 220 4" stroke="#2e7d32" stroke-width="3" fill="none"/>
    ${[[-4, 10, '#ff6b6b'], [22, 20, '#ffd43b'], [48, 27, '#69db7c'], [74, 31, '#4dabf7'], [100, 33, '#ff6b6b'], [126, 31, '#ffd43b'], [152, 27, '#69db7c'], [178, 20, '#4dabf7'], [204, 10, '#ff6b6b']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`).join('')}
    <rect x="-20" y="210" width="240" height="40" fill="#f4f8ff"/>
    <rect x="11" y="196" width="10" height="16" fill="#7a4a2a"/>
    <path d="M16 112 L44 160 L-12 160 Z M16 136 L50 194 L-18 194 Z" fill="#2f8f46" stroke="#1f6b33" stroke-width="2" stroke-linejoin="round"/>
    <path d="${star(16, 108, 8, 3.5)}" fill="#ffd43b"/>
    ${dots([[6, 150, 3], [28, 172, 3], [10, 184, 3], [30, 146, 3]], 3, '#ff6b6b')}
    <rect x="178" y="190" width="24" height="22" rx="3" fill="#ff6b6b"/><rect x="188" y="190" width="4" height="22" fill="#ffd43b"/><rect x="178" y="198" width="24" height="4" fill="#ffd43b"/>`,

  bg_sea: () => `
    ${bgRect('#ffe0c2')}
    <circle cx="168" cy="40" r="22" fill="#ff9f6b"/>
    <rect x="-20" y="150" width="240" height="50" fill="#5bb6ea"/>
    <path d="M-5 165h22M40 178h26M110 162h22M150 182h30M190 168h20" stroke="#d6f0ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M-20 200 Q30 192 100 198 T220 196 V250 H-20 Z" fill="#f6e3b4"/>
    <path d="M176 226 l10 -12 l10 12 Z" fill="#ffb3c1" stroke="#e48aa0" stroke-width="2" stroke-linejoin="round"/>
    <path d="M10 6 q6 -6 12 0 q6 -6 12 0" stroke="#7a8a9a" stroke-width="2" fill="none"/>`,

  bg_rain: (id) => {
    const drops = [[-8, 0], [18, 22], [44, -6], [70, 30], [96, 4], [122, 26], [148, -2], [174, 20], [200, 6], [6, 60], [32, 88], [58, 70],
      [150, 66], [176, 92], [204, 74], [-6, 130], [24, 156], [182, 140], [208, 166], [10, 190], [196, 196], [40, 120], [160, 118]];
    return `
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b9bb0"/><stop offset="1" stop-color="#c8d3df"/></linearGradient></defs>
    ${bgRect(`url(#${id}g)`)}
    <g fill="#6f7d90"><ellipse cx="20" cy="-6" rx="46" ry="20"/><ellipse cx="88" cy="-12" rx="40" ry="18"/><ellipse cx="170" cy="-4" rx="52" ry="22"/></g>
    <g fill="#7f8ca0"><ellipse cx="54" cy="8" rx="30" ry="12"/><ellipse cx="136" cy="10" rx="34" ry="13"/></g>
    <g stroke="#eef4fa" stroke-width="2" stroke-linecap="round" opacity=".75">${drops.map(([x, y]) => `<line x1="${x}" y1="${y + 20}" x2="${x - 4}" y2="${y + 31}"/>`).join('')}</g>
    <rect x="-20" y="206" width="240" height="44" fill="#9db58c"/>
    <ellipse cx="22" cy="226" rx="24" ry="6" fill="#b9d3ea"/><ellipse cx="176" cy="234" rx="30" ry="7" fill="#b9d3ea"/>
    <g fill="none" stroke="#e3eef8" stroke-width="1.5"><ellipse cx="22" cy="226" rx="10" ry="2.5"/><ellipse cx="176" cy="234" rx="14" ry="3"/></g>`;
  },

  bg_winter: (id) => `
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfdcec"/><stop offset="1" stop-color="#e8eff7"/></linearGradient></defs>
    ${bgRect(`url(#${id}g)`)}
    <path d="M-20 196 Q30 168 80 190 Q140 160 220 188 V250 H-20 Z" fill="#fff"/>
    <circle cx="196" cy="206" r="14" fill="#fff" stroke="#c8d4e2" stroke-width="2"/><circle cx="196" cy="184" r="10" fill="#fff" stroke="#c8d4e2" stroke-width="2"/>
    <circle cx="192" cy="182" r="1.6" fill="${EYE}"/><circle cx="200" cy="182" r="1.6" fill="${EYE}"/><path d="M196 186 l6 2 l-6 1 Z" fill="#ff8c3a"/>
    ${dots([[0, 10], [40, 40], [80, -8], [150, 20], [200, 60], [20, 90], [180, 120], [-6, 160], [60, 140], [140, 0], [205, 10]], 3, '#fff')}`,
};

/* ---------- 옷 (몸 모양에 맞춰야 하는 것은 clip 사용) ---------- */
const OUTFIT = {
  skirt: () => `<path d="M60 150 Q100 162 140 150 L156 182 Q100 196 44 182 Z" fill="#ff9ec4" stroke="#d96a99" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots([[80, 175], [100, 180], [120, 175]], 3, '#fff')}`,

  hula_skirt: () => {
    let s = '';
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = (1 - t) ** 2 * 56 + 2 * (1 - t) * t * 100 + t * t * 144;
      const y = (1 - t) ** 2 * 152 + 2 * (1 - t) * t * 168 + t * t * 152;
      const dx = (x - 100) * 0.18;
      s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + 36).toFixed(1)}" stroke="${i % 2 ? '#3f9f3f' : '#6fcf5f'}" stroke-width="7" stroke-linecap="round"/>`;
    }
    const fl = (cx, cy) => dots([[cx - 5, cy], [cx + 5, cy], [cx, cy - 5], [cx - 3, cy + 5], [cx + 3, cy + 5]], 4.5, '#ff6f91') + `<circle cx="${cx}" cy="${cy + 1}" r="2.5" fill="#ffd43b"/>`;
    return s + `<path d="M56 152 Q100 168 144 152" stroke="#c98a3a" stroke-width="5" fill="none" stroke-linecap="round"/>` + fl(128, 158);
  },

  bikini: (id) => `
    <g clip-path="url(#${id}c)">
      <path d="M45 158 H155" stroke="#ff6f8a" stroke-width="3"/>
      <rect x="40" y="168" width="120" height="16" fill="#ff7a8a"/>
      <path d="M40 168 H160" stroke="#e0566c" stroke-width="2.5"/>
    </g>
    <path d="M74 165 L86 150 L98 165 Z M102 165 L114 150 L126 165 Z" fill="#ff7a8a" stroke="#e0566c" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots([[86, 160], [114, 160]], 1.8, '#fff')}`,

  pants: () => `<path d="M48 148 Q100 160 152 148 L160 198 L106 198 L100 180 L94 198 L40 198 Z" fill="#5b8def" stroke="#3a64b8" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M48 148 Q100 160 152 148" stroke="#3a64b8" stroke-width="4" fill="none"/>
    <path d="M72 168 L66 196 M128 168 L134 196" stroke="#3a64b8" stroke-width="1.5" opacity=".6"/>
    <rect x="96" y="150" width="8" height="8" rx="1.5" fill="#ffd43b" stroke="#c99400" stroke-width="1.5"/>`,

  // 후드와 코트를 한 덩어리로 그리고, 얼굴 부분만 구멍(evenodd). 후드는 머리 크기에 딱 맞게, 잎은 그리지 않음.
  // 장화를 신으면 장화와 겹치지 않게 아랫단을 12 짧게
  raincoat: (id, equip = {}) => {
    const b = equip.foot === 'boots' ? 184 : 196;   // 옆단 높이
    const k = 196 - b;
    return `
    <path fill-rule="evenodd" d="M36 ${b} L41 152 C30 100 52 56 100 56 C148 56 170 100 159 152 L164 ${b} Q100 ${b + 12} 36 ${b} Z
      M54 150 C50 106 70 74 100 74 C130 74 150 106 146 150 Q100 162 54 150 Z" fill="#ffd43b" stroke="#d4a017" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M56 146 C53 106 72 78 100 78 C128 78 147 106 144 146" stroke="#e8b923" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M100 157 V${203 - k}" stroke="#d4a017" stroke-width="2.5"/>
    <path d="M87 153 L100 163 L113 153" fill="#ffe680" stroke="#d4a017" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60 ${182 - k / 2} h14 M126 ${182 - k / 2} h14" stroke="#d4a017" stroke-width="2.5" stroke-linecap="round"/>
    ${dots([[107, 172], [107, 186 - k / 2]], 2.5, '#d4a017')}`;
  },
};

const tubeArc = (front) => {
  const d = front ? 'M168 160 A68 22 0 0 1 32 160' : 'M32 160 A68 22 0 0 1 168 160';
  return `<g transform="rotate(-8 100 160)" fill="none"><path d="${d}" stroke="#d94a62" stroke-width="19"/>
    <path d="${d}" stroke="#ff6b81" stroke-width="15"/><path d="${d}" stroke="#fff" stroke-width="15" stroke-dasharray="18 20"/></g>`;
};

/* ---------- 소품 ---------- */
const PROP = {
  // 🥝 두나: 하초 오른발 옆에 작게 (함수 호출 시점에 그려야 해서 지연 실행)
  duna: () => `<g transform="translate(148 155) scale(.3)">${dunaInner()}</g>`,
  // 📿 목걸이: 진주 줄 + 가운데 펜던트
  necklace: () => {
    let pearls = '';
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = (1 - t) ** 2 * 60 + 2 * (1 - t) * t * 100 + t * t * 140;
      const y = (1 - t) ** 2 * 147 + 2 * (1 - t) * t * 170 + t * t * 147;  // 입(아래 끝 y145)보다 아래
      pearls += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#fffaf0" stroke="#d8cbb4" stroke-width="1.2"/>`;
    }
    return pearls + `<path d="M100 160 l7 9 l-7 10 l-7 -10 Z" fill="#ffd23f" stroke="#c99400" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="169" r="2.6" fill="#ff8fb1"/>`;
  },
  tube: () => tubeArc(true),
  scarf: () => `<path d="M50 148 Q100 172 150 148 L150 160 Q100 184 50 160 Z" fill="#e74c3c" stroke="#a83226" stroke-width="2"/>
    <rect x="118" y="160" width="15" height="32" rx="4" fill="#e74c3c" stroke="#a83226" stroke-width="2"/>
    <path d="M121 192 v5 M126 192 v5 M131 192 v5" stroke="#a83226" stroke-width="2" stroke-linecap="round"/>`,
};

/* ---------- 얼굴 ---------- */
const FACE = {
  sunglasses: () => `<rect x="64" y="101" width="32" height="21" rx="8" fill="${EYE}"/><rect x="104" y="101" width="32" height="21" rx="8" fill="${EYE}"/>
    <line x1="94" y1="109" x2="106" y2="109" stroke="${EYE}" stroke-width="4"/>
    <rect x="70" y="105" width="9" height="4" rx="2" fill="#fff" opacity=".55"/><rect x="110" y="105" width="9" height="4" rx="2" fill="#fff" opacity=".55"/>`,
  glasses: () => `<g fill="#fff" fill-opacity=".2" stroke="#6b4a2a" stroke-width="3"><circle cx="82" cy="112" r="13"/><circle cx="118" cy="112" r="13"/></g>
    <path d="M95 111 Q100 107 105 111" stroke="#6b4a2a" stroke-width="3" fill="none"/>`,
  goggles: (id) => `<g clip-path="url(#${id}c)"><rect x="40" y="107" width="120" height="9" fill="#2b6cb0"/></g>
    <g fill="#9be3ff" fill-opacity=".7" stroke="#2b6cb0" stroke-width="4"><ellipse cx="82" cy="112" rx="15" ry="12"/><ellipse cx="118" cy="112" rx="15" ry="12"/></g>
    <rect x="96" y="109" width="8" height="5" fill="#2b6cb0"/>
    <path d="M74 106 l5 -2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M110 106 l5 -2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  blush: () => `<ellipse cx="68" cy="128" rx="9" ry="5" fill="#ff8fb1" opacity=".75"/><ellipse cx="132" cy="128" rx="9" ry="5" fill="#ff8fb1" opacity=".75"/>`,
};

/* ---------- 머리 ---------- */
const HEAD = {
  flower: () => {
    const cx = 58, cy = 74;
    return dots([[cx, cy - 8], [cx + 8, cy - 2], [cx + 5, cy + 7], [cx - 5, cy + 7], [cx - 8, cy - 2]], 6, '#fff', 'stroke="#f2a7c0" stroke-width="1.5"') +
      `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#ffd43b"/>`;
  },
  ribbon: () => `<g transform="translate(146 76) rotate(20)"><path d="M0 0 L-19 -13 L-19 13 Z M0 0 L19 -13 L19 13 Z" fill="#ff6fa8" stroke="#c94a80" stroke-width="2.5" stroke-linejoin="round"/><circle r="6" fill="#ff6fa8" stroke="#c94a80" stroke-width="2.5"/></g>`,
  hat: () => `<ellipse cx="100" cy="68" rx="60" ry="11" fill="#f4d58d" stroke="#c9a24a" stroke-width="2.5"/>
    <path d="M70 68 Q70 52 100 52 Q130 52 130 68 Z" fill="#f4d58d" stroke="#c9a24a" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M71 62 Q100 57 129 62 L130 67 Q100 62 70 67 Z" fill="#ff8fa3"/>`,
  crown: () => `<path d="M74 72 L77 47 L88 60 L100 41 L112 60 L123 47 L126 72 Z" fill="#ffd23f" stroke="#c99400" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="100" cy="64" r="4" fill="#ff5a7a"/><circle cx="85" cy="67" r="2.8" fill="#4dabf7"/><circle cx="115" cy="67" r="2.8" fill="#4dabf7"/>`,
};

/* ---------- 손 ---------- */
const HAND = {
  // 📖 책: 왼손(18,98)에 펼쳐 든 모양 — 몸 앞 원래 그림을 작게 줄여 왼손 위치로
  book: () => `<g transform="translate(12 104) rotate(-14) scale(.7) translate(-100 -170)">
    <path d="M68 158 Q84 151 100 160 Q116 151 132 158 V186 Q116 179 100 188 Q84 179 68 186 Z" fill="#4dabf7" stroke="#1c7ed6" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M72 158 Q86 153 100 161 V184 Q86 177 72 182 Z M128 158 Q114 153 100 161 V184 Q114 177 128 182 Z" fill="#ffffff" stroke="#c5d3e0" stroke-width="2" stroke-linejoin="round"/>
    <path d="M77 164 Q86 161 95 165 M77 169 Q86 166 95 170 M77 174 Q86 171 95 175 M105 165 Q114 161 123 164 M105 170 Q114 166 123 169" stroke="#b0bccb" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M118 150 V164 L121 161 L124 164 V150" fill="#ff6b81"/></g>`,
  // ☕ 따뜻한 커피잔: 오른손(182,98)에 든 머그 + 김
  coffee: () => `<path d="M184 86 q-4 -5 0 -10 q4 -5 0 -10 M192 86 q-4 -5 0 -10 q4 -5 0 -10" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="M184 86 q-4 -5 0 -10 q4 -5 0 -10 M192 86 q-4 -5 0 -10 q4 -5 0 -10" stroke="#c9b8a6" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M200 96 h4 a6 6 0 0 1 0 12 h-4" fill="none" stroke="#8a5a3a" stroke-width="3"/>
    <path d="M176 92 h24 v16 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 Z" fill="#fff8ee" stroke="#8a5a3a" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="188" cy="93" rx="11" ry="2.6" fill="#7a4a2a"/>
    <rect x="176" y="100" width="24" height="5" fill="#ff8fa3"/>`,
  wand: () => `<line x1="182" y1="98" x2="186" y2="64" stroke="#8a5a3a" stroke-width="4.5" stroke-linecap="round"/>
    <path d="${star(185, 52, 12)}" fill="#ffd23f" stroke="#c99400" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots([[168, 40], [204, 44], [196, 30]], 2, '#ffe27a')}`,
  balloon: () => `<path d="M18 98 Q6 70 22 44" stroke="#555" fill="none" stroke-width="2"/>
    <ellipse cx="22" cy="28" rx="15" ry="18" fill="#ff6b6b" stroke="#c94a4a" stroke-width="2.5"/>
    <path d="M19 46 l3 -2 l3 2 Z" fill="#c94a4a"/><ellipse cx="16" cy="22" rx="4" ry="6" fill="#fff" opacity=".5"/>`,
  camera: () => `<g transform="translate(186 94)"><rect x="-18" y="-12" width="36" height="24" rx="5" fill="#3a3f4a" stroke="#1e2630" stroke-width="2"/>
    <rect x="-12" y="-17" width="10" height="6" rx="2" fill="#3a3f4a"/><circle r="8" fill="#9fb4c8" stroke="#1e2630" stroke-width="2.5"/>
    <circle cx="-2" cy="-2" r="2.5" fill="#fff" opacity=".7"/><rect x="10" y="-8" width="5" height="3" rx="1" fill="#ffd43b"/></g>`,
  parasol: () => `<path d="M18 98 L24 14" stroke="#8a5a3a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M18 98 q0 7 -6 7" stroke="#8a5a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M-8 14 A32 32 0 0 1 56 14 Q48 8 40 14 Q32 8 24 14 Q16 8 8 14 Q0 8 -8 14 Z" fill="#ffc2d4" stroke="#e07a9a" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M24 -18 L8 14 M24 -18 L40 14" stroke="#e07a9a" stroke-width="2"/><circle cx="24" cy="-18" r="2.5" fill="#e07a9a"/>`,
};

/* ---------- 발 ---------- */
const FOOT = {
  boots: () => `<g fill="#ffd43b" stroke="#d4a017" stroke-width="2.5" stroke-linejoin="round">
      <path d="M71 190 H87 V208 Q87 214 81 214 H64 Q59 214 59 210 Q59 206 65 206 H71 Z"/>
      <path d="M113 190 H129 V206 H135 Q141 206 141 210 Q141 214 136 214 H119 Q113 214 113 208 Z"/></g>
    <g fill="#ffe680" stroke="#d4a017" stroke-width="2"><rect x="69" y="187" width="20" height="6" rx="3"/><rect x="111" y="187" width="20" height="6" rx="3"/></g>
    <path d="M60 213 H86 M114 213 H140" stroke="#b07800" stroke-width="2.5" stroke-linecap="round"/>`,
  skateboard: () => `<rect x="54" y="207" width="92" height="9" rx="4.5" fill="#ff9f43" stroke="#b56a1f" stroke-width="2.5"/>
    <circle cx="74" cy="221" r="6" fill="#444"/><circle cx="126" cy="221" r="6" fill="#444"/>`,
};

// 몸 뒤에 그려야 하는 부분 (잎 다음, 몸 앞)
const BEHIND = { prop: { tube: () => tubeArc(false) } };

// 이 아이템을 입으면 잎을 그리지 않음 (후드가 머리를 덮음)
const HIDES_LEAVES = new Set(['raincoat']);

const LAYERS = { bg: BG, outfit: OUTFIT, prop: PROP, face: FACE, head: HEAD, hand: HAND, foot: FOOT };

/** 아이템 그림이 있는지 (개발용 확인) */
export const hasArt = (slot, id) => !!(LAYERS[slot] && LAYERS[slot][id]);

/**
 * 하초 SVG 문자열.
 * @param {object} equip  { bg, head, face, outfit, prop, hand, foot } → item id
 * @param {object} [o]
 * @param {boolean} [o.bg=true]  배경 아이템을 그릴지
 * @param {string} [o.label]
 */
export function hacho(equip = {}, { bg = true, label = '하초' } = {}) {
  const id = 'h' + ++uid;
  const L = (slot) => {
    const f = LAYERS[slot][equip[slot]];
    return f ? f(id, equip) : '';
  };
  const B = (slot) => {
    const f = BEHIND[slot] && BEHIND[slot][equip[slot]];
    return f ? f(id) : '';
  };
  return `<svg class="char-svg" viewBox="${VB}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
<defs><clipPath id="${id}c"><circle cx="100" cy="120" r="55"/></clipPath><clipPath id="${id}bc"><rect ${BG_BOX}/></clipPath></defs>
${bg && equip.bg ? `<g clip-path="url(#${id}bc)">${L('bg')}</g>` : ''}${bg && equip.bg ? LIMB_HALO : ''}${LIMBS}${HIDES_LEAVES.has(equip.outfit) ? '' : LEAVES}${B('prop')}
<circle cx="100" cy="120" r="55" fill="#8fd3ff" stroke="#4a9fd6" stroke-width="3"/>
${L('outfit')}${L('prop')}${EYES}${MOUTH}${L('face')}${L('head')}${L('hand')}${L('foot')}</svg>`;
}

/* ---------- 두나 ---------- */
// 뽀글뽀글 외곽선: 원 둘레를 n칸으로 나눠 바깥으로 볼록한 작은 호를 이어 붙임
function curlyCircle(cx, cy, R, n) {
  let d = '';
  const chord = 2 * R * Math.sin(Math.PI / n);
  const r = (chord / 2) * 1.15;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = (cx + Math.cos(a) * R).toFixed(1);
    const y = (cy + Math.sin(a) * R).toFixed(1);
    d += i === 0 ? `M${x} ${y}` : ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x} ${y}`;
  }
  return d + 'Z';
}
const DUNA_BODY = curlyCircle(100, 120, 53, 24);
const DUNA_LIMBS = `<g stroke="${INK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
  <polyline points="52,106 22,122 52,138"/><polyline points="148,106 178,122 148,138"/>
  <line x1="84" y1="171" x2="80" y2="197"/><line x1="116" y1="171" x2="120" y2="197"/></g>`;
const DUNA_CURLS = [[78, 84], [112, 80], [134, 98], [64, 146], [140, 140], [100, 164], [70, 100], [124, 158]]
  .map(([x, y]) => `<path d="M${x - 4} ${y} a4 4 0 1 1 4 4" stroke="#9a5a2a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`).join('');

/** 두나 그림 본체 (SVG 안쪽 마크업, 하초와 같은 좌표계) */
const dunaInner = () => `${DUNA_LIMBS}
<path d="${DUNA_BODY}" fill="#c98a4b" stroke="#8a5427" stroke-width="3" stroke-linejoin="round"/>
${DUNA_CURLS}
${EYES}
<path d="M92 121 L92 141 L116 131 Z" fill="#ffd23f" stroke="#c99400" stroke-width="3" stroke-linejoin="round"/>`;

export function duna({ label = '두나' } = {}) {
  return `<svg class="char-svg" viewBox="${VB}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
${dunaInner()}</svg>`;
}
