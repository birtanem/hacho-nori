// 추억조각 · 꾸미기 아이템 · 쿠지 박스 구성 · 게임 목록 · 대사
// (CLAUDE.md 3·4·5·6·9장)

/* ---------- 추억조각 (13개) ---------- */
// 배열 순서 = 사진첩 정렬 순서 (A → B → 무지개), 획득 순서와 무관.
export const MEMORIES = [
  { id: 'blossom', grade: 'A', icon: '🌸', name: '벚꽃잎', caption: '성북천 벚꽃이 가득하던 날' },
  { id: 'ticket', grade: 'A', icon: '🎫', name: '티켓', caption: '이 세상의 모든 얘기 소설이나 전설이나.. 다아 보러가쟈' },
  { id: 'ginkgo', grade: 'A', icon: '🍂', name: '은행잎', caption: '600살까지 함께해!' },
  { id: 'snow', grade: 'A', icon: '❄️', name: '눈결정', caption: '첫눈이 올때마다 늘 생각나!' },

  { id: 'lavender', grade: 'B', icon: '💜', name: '라벤더', caption: '잊지말아요 라벤더향 킁카킁카' },
  { id: 'hula', grade: 'B', icon: '🌺', name: '훌라', caption: '인생이란 눈치보지 않고 춤을 추는 것 !' },
  { id: 'pot', grade: 'B', icon: '🪴', name: '화분', caption: '화분도 자라고 하초도 자라나' },
  { id: 'jam', grade: 'B', icon: '🍓', name: '잼', caption: '잼얘없어?' },
  { id: 'bread', grade: 'B', icon: '🍃🍞', name: '나뭇잎+빵', caption: '긴 풀빵길도 함께면 금방이야!' },
  { id: 'tree', grade: 'B', icon: '🎄', name: '크리스마스트리', caption: '나에겐 너가 선물이야아아' },
  { id: 'hourglass', grade: 'B', icon: '⏳', name: '모래시계', caption: '오래전부터 당신같은 친구를 기다려 왔다우' },
  { id: 'cake', grade: 'B', icon: '🎂', name: '케이크', caption: 'HAPPY BIRTHDAY HACHO!' },

  { id: 'rainbow', grade: 'R', icon: '🌈', name: '무지개', caption: '오래오래 매일매일 즐겁게 놀자!' },
];
export const MEMORY_BY_ID = Object.fromEntries(MEMORIES.map((m) => [m.id, m]));

/* ---------- 꾸미기 부위 ---------- */
// 꾸미기 화면에 보여주는 순서
export const SLOTS = [
  { id: 'bg', name: '배경' },
  { id: 'head', name: '머리' },
  { id: 'face', name: '얼굴' },
  { id: 'outfit', name: '옷' },
  { id: 'prop', name: '소품' },
  { id: 'hand', name: '손' },
  { id: 'foot', name: '발' },
];

/* ---------- 꾸미기 아이템 (C 8 · D 16 + 왕관) ---------- */
export const ITEMS = [
  // 레어 (C상)
  { id: 'bg_spring', grade: 'C', slot: 'bg', icon: '🌷', name: '봄날 배경' },
  { id: 'bg_star', grade: 'C', slot: 'bg', icon: '🌌', name: '별밤 배경' },
  { id: 'bg_xmas', grade: 'C', slot: 'bg', icon: '🎅', name: '크리스마스 배경' },
  { id: 'hula_skirt', grade: 'C', slot: 'outfit', icon: '🌴', name: '훌라치마' },
  { id: 'sunglasses', grade: 'C', slot: 'face', icon: '🕶️', name: '선글라스' },
  { id: 'camera', grade: 'C', slot: 'hand', icon: '📷', name: '카메라' },
  { id: 'wand', grade: 'C', slot: 'hand', icon: '🪄', name: '요술봉' },
  { id: 'skateboard', grade: 'C', slot: 'foot', icon: '🛹', name: '스케이트보드' },

  // 일반 (D상)
  { id: 'bg_sea', grade: 'D', slot: 'bg', icon: '🌊', name: '바다 배경' },
  { id: 'bg_winter', grade: 'D', slot: 'bg', icon: '⛄', name: '겨울 배경' },
  { id: 'parasol', grade: 'D', slot: 'hand', icon: '⛱️', name: '양산' },
  { id: 'bikini', grade: 'D', slot: 'outfit', icon: '👙', name: '비키니' },
  { id: 'tube', grade: 'D', slot: 'prop', icon: '🛟', name: '튜브' },
  { id: 'goggles', grade: 'D', slot: 'face', icon: '🥽', name: '물안경' },
  { id: 'flower', grade: 'D', slot: 'head', icon: '🌼', name: '머리에 꽃' },
  { id: 'balloon', grade: 'D', slot: 'hand', icon: '🎈', name: '풍선' },
  { id: 'hat', grade: 'D', slot: 'head', icon: '👒', name: '모자' },
  { id: 'scarf', grade: 'D', slot: 'prop', icon: '🧣', name: '목도리' },
  { id: 'raincoat', grade: 'D', slot: 'outfit', icon: '🧥', name: '우비' },
  { id: 'pants', grade: 'D', slot: 'outfit', icon: '👖', name: '바지' },
  { id: 'skirt', grade: 'D', slot: 'outfit', icon: '👗', name: '치마' },
  { id: 'ribbon', grade: 'D', slot: 'head', icon: '🎀', name: '리본' },
  { id: 'glasses', grade: 'D', slot: 'face', icon: '👓', name: '안경' },
  { id: 'blush', grade: 'D', slot: 'face', icon: '😊', name: '볼터치' },

  // 특별 (무지개 쿠지와 함께 지급, 수집 n/24 에는 포함하지 않음)
  { id: 'crown', grade: 'S', slot: 'head', icon: '👑', name: '왕관' },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const COLLECT_ITEMS = ITEMS.filter((i) => i.grade === 'C' || i.grade === 'D'); // 24개

/* ---------- 쿠지 ---------- */
export const BOX_COUNT = 2;                                  // 1탄 → 2탄
export const BOX_GRADES = { A: 2, B: 4, C: 4, D: 8, E: 2 };  // 한 박스 20장
export const GRADES = {
  A: { label: 'A상', prize: '추억조각' },
  B: { label: 'B상', prize: '추억조각' },
  C: { label: 'C상', prize: '꾸미기 아이템 · 레어' },
  D: { label: 'D상', prize: '꾸미기 아이템' },
  E: { label: 'E상', prize: '코인 환급' },
  R: { label: '무지개', prize: '무지개 조각 + 왕관' },
};

/* ---------- 게임 목록 (홈 카드 순서) ---------- */
export const GAME_LIST = [
  { id: 'tap', icon: '👆', name: '탭탭 하초', desc: '10초 동안 하초를 마구 눌러요' },
  { id: 'pair', icon: '🃏', name: '짝꿍 찾기', desc: '같은 그림 카드 두 장을 찾아요' },
  { id: 'mole', icon: '🕳️', name: '하초 찾기', desc: '튀어나온 하초를 톡! 벌은 피해요' },
  { id: 'catch', icon: '🍃', name: '잎사귀 받기', desc: '떨어지는 잎을 받아요. 벌레는 피하기!' },
  { id: 'runner', icon: '🛼', name: '롤러스케이트 하초', desc: '톡 눌러 점프! 낮게 나는 벌은 그냥 지나가요' },
  { id: 'tower', icon: '🥞', name: '풀빵 탑 쌓기', desc: '딱 맞춰 떨어뜨려 높이 쌓아요' },
];

/* ---------- 홈 말풍선 대사 ---------- */
export const HOME_LINES = [
  '오늘도 놀러 와줘서 고마워!',
  '코인 모아서 쿠지 뽑자~',
  '내 잎은 다섯 장이야!',
  '두나는 뽀글뽀글해 🥝',
  '심심하면 나를 눌러봐',
  '꾸며주면 기분 좋아 ✨',
  '추억조각 하나씩 모으는 중!',
  '두쫀쿠 먹고 싶다아',
];
