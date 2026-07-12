// Soft, low-saturation ambient shadows — depth without the drop-shadow look.

const shadow = (color) => [
  'none',
  `0 1px 2px 0 ${color(0.05)}`,
  `0 1px 3px 0 ${color(0.08)}, 0 1px 2px -1px ${color(0.06)}`,
  `0 2px 6px -1px ${color(0.09)}, 0 2px 4px -2px ${color(0.06)}`,
  `0 4px 10px -2px ${color(0.1)}, 0 2px 5px -2px ${color(0.06)}`,
  `0 6px 14px -3px ${color(0.1)}, 0 3px 6px -3px ${color(0.07)}`,
  `0 8px 18px -4px ${color(0.11)}, 0 4px 8px -4px ${color(0.07)}`,
  `0 10px 22px -5px ${color(0.12)}, 0 4px 9px -5px ${color(0.08)}`,
  `0 12px 26px -6px ${color(0.13)}, 0 5px 10px -5px ${color(0.08)}`,
  `0 14px 30px -6px ${color(0.14)}, 0 5px 11px -6px ${color(0.09)}`,
  `0 16px 34px -7px ${color(0.15)}, 0 6px 12px -6px ${color(0.09)}`,
  `0 18px 38px -7px ${color(0.16)}, 0 6px 13px -7px ${color(0.1)}`,
  `0 20px 42px -8px ${color(0.17)}, 0 7px 14px -7px ${color(0.1)}`,
  `0 22px 46px -8px ${color(0.18)}, 0 7px 15px -8px ${color(0.11)}`,
  `0 24px 50px -9px ${color(0.19)}, 0 8px 16px -8px ${color(0.11)}`,
  `0 26px 54px -9px ${color(0.2)}, 0 8px 17px -9px ${color(0.12)}`,
  `0 28px 58px -10px ${color(0.21)}, 0 9px 18px -9px ${color(0.12)}`,
  `0 30px 62px -10px ${color(0.22)}, 0 9px 19px -10px ${color(0.13)}`,
  `0 32px 66px -11px ${color(0.23)}, 0 10px 20px -10px ${color(0.13)}`,
  `0 34px 70px -11px ${color(0.24)}, 0 10px 21px -11px ${color(0.14)}`,
  `0 36px 74px -12px ${color(0.25)}, 0 11px 22px -11px ${color(0.14)}`,
  `0 38px 78px -12px ${color(0.26)}, 0 11px 23px -12px ${color(0.15)}`,
  `0 40px 82px -13px ${color(0.27)}, 0 12px 24px -12px ${color(0.15)}`,
  `0 42px 86px -13px ${color(0.28)}, 0 12px 25px -13px ${color(0.16)}`,
  `0 44px 90px -14px ${color(0.3)}, 0 13px 26px -13px ${color(0.17)}`,
];

const lightColor = (a) => `rgba(15, 23, 42, ${a})`;
const darkColor = (a) => `rgba(0, 0, 0, ${Math.min(a * 2.2, 0.7)})`;

export const shadows = (mode) => shadow(mode === 'dark' ? darkColor : lightColor);
