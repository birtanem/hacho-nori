// 모든 밸런스 숫자는 여기에서만 관리한다. (CLAUDE.md 7장)
export const CONFIG = {
  kujiPrice: 70,         // 1회 가격. 70 ≈ 1시간15분, 100 ≈ 1시간50분, 130 ≈ 2시간20분
  startCoins: 70,        // 시작하자마자 1회 뽑아볼 수 있게
  eRefundRate: 0.3,      // E상 = 가격의 30% 환급
  games: {
    tap:    { time: 10, cap: 20 },
    pair:   { time: 40, cap: 45 },
    mole:   { time: 20, cap: 30 },
    catch:  { time: 30, cap: 40 },
    runner: { time: 30, cap: 40 },
    tower:  { time: 30, cap: 50 },
  },
};
