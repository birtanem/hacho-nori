// 저장 / 불러오기 / 초기화.
// localStorage 접근은 전부 try/catch — 저장이 안 되는 환경에서도 메모리 상태로 계속 동작한다.
import { CONFIG } from './config.js';

const KEY = 'hacho_nori_v1';

export function defaultState() {
  return {
    v: 1,
    coins: CONFIG.startCoins,
    boxNo: 1,           // 1 = 1탄, 2 = 2탄, 3 = 두 박스 모두 끝
    box: null,          // { papers: ['A','D',…20], opened: [index…] } — 쿠지(4단계)에서 생성
    memories: {},       // { blossom: { at: '2026.11.18' } }
    items: {},          // { bikini: { at: '…' } }
    equip: {},          // { bg, head, face, outfit, prop, hand, foot } → item id
    captions: {},       // 사용자가 고친 문장만 { blossom: '…' }
    best: {},           // 게임별 최고 획득 코인 { tap: 18 }
    endingSeen: false,
  };
}

const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

// 저장값이 깨져 있어도 앱이 죽지 않게, 기본값 위에 타입이 맞는 것만 덮어쓴다.
function sanitize(raw) {
  const d = defaultState();
  if (!isObj(raw)) return d;
  if (Number.isFinite(raw.coins) && raw.coins >= 0) d.coins = Math.floor(raw.coins);
  if ([1, 2, 3].includes(raw.boxNo)) d.boxNo = raw.boxNo;
  if (isObj(raw.box) && Array.isArray(raw.box.papers) && Array.isArray(raw.box.opened)) d.box = raw.box;
  for (const k of ['memories', 'items', 'equip', 'captions', 'best']) if (isObj(raw[k])) d[k] = raw[k];
  d.endingSeen = raw.endingSeen === true;
  return d;
}

function read() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? sanitize(JSON.parse(s)) : defaultState();
  } catch (e) {
    return defaultState();
  }
}

/** 현재 상태. reset() 하면 새 객체로 바뀌므로 항상 이 이름으로 접근할 것 (live binding). */
export let S = read();

let storageOk = true;
const listeners = new Set();

/** 상태가 바뀔 때마다 호출될 함수 등록. 해제 함수를 돌려준다. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 저장 + 알림. S를 고친 뒤 호출한다. 저장 실패해도 false만 돌려주고 계속 동작. */
export function save() {
  let ok = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    ok = false;
  }
  const firstFail = storageOk && !ok;
  storageOk = ok;
  listeners.forEach((fn) => {
    try { fn(S, { saveFailed: firstFail }); } catch (e) { console.error(e); }
  });
  return ok;
}

export function addCoins(n) {
  S.coins = Math.max(0, S.coins + Math.floor(n));
  save();
}

/** 코인이 충분하면 차감하고 true. 부족하면 아무것도 안 하고 false. */
export function spendCoins(n) {
  if (S.coins < n) return false;
  S.coins -= n;
  save();
  return true;
}

/** 처음부터 다시하기 */
export function reset() {
  S = defaultState();
  try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
  save();
}
