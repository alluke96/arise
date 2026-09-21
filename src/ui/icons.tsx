import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color } from './tokens';

type P = { size?: number; c?: ColorValue };
const base = (s: number) => ({
  width: s, height: s, viewBox: '0 0 24 24',
  fill: 'none', strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const IconHome = ({ size = 20, c = color.textMuted }: P) => (
  <Svg {...base(size)} stroke={c}><Path d="M3 10.6 12 3.2l9 7.4" /><Path d="M5.6 9.4V20.8h12.8V9.4" /></Svg>
);
export const IconSword = ({ size = 20, c = color.textMuted }: P) => (
  <Svg {...base(size)} stroke={c}>
    <Path d="M19.5 3.2 9.8 12.9l1.3 1.3 9.7-9.7Z" /><Path d="m8 14.7 1.3 1.3" />
    <Path d="M4.2 18.5 7 15.7l1.3 1.3-2.8 2.8Z" /><Path d="M4.5 3.2 14.2 12.9l-1.3 1.3L3.2 4.5Z" />
  </Svg>
);
export const IconBook = ({ size = 20, c = color.textMuted }: P) => (
  <Svg {...base(size)} stroke={c}>
    <Path d="M4 4.2h6.1c1 0 1.9.8 1.9 1.9v13.7c0-1.1-.8-1.9-1.9-1.9H4Z" />
    <Path d="M20 4.2h-6.1c-1 0-1.9.8-1.9 1.9v13.7c0-1.1.8-1.9 1.9-1.9H20Z" />
  </Svg>
);
export const IconArmy = ({ size = 20, c = color.textMuted }: P) => (
  <Svg {...base(size)} stroke={c}>
    <Circle cx="9.2" cy="8" r="3.3" /><Path d="M3.2 20.3c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <Path d="M16.2 5.2a3.3 3.3 0 0 1 0 6" /><Path d="M18.3 14.9c1.6.8 2.5 2.4 2.5 4.4" />
  </Svg>
);
export const IconClock = ({ size = 16, c = color.redText }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={2}><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5.2l3.2 2" /></Svg>
);
export const IconFlame = ({ size = 19, c = color.redText }: P) => (
  <Svg {...base(size)} stroke={c}>
    <Path d="M12 2.8s5.6 4.4 5.6 9.5a5.6 5.6 0 0 1-11.2 0c0-2 1-3.6 1.9-4.7.3 1.6 1.2 2.5 2.1 2.5 1.3 0 1.9-1.4 1.6-7.3Z" />
  </Svg>
);
export const IconStone = ({ size = 19, c = color.blue }: P) => (
  <Svg {...base(size)} stroke={c}><Path d="M12 2.6 20 7v10l-8 4.4L4 17V7Z" /><Path d="M12 8.4 15.6 10v4l-3.6 2-3.6-2v-4Z" /></Svg>
);
export const IconCheck = ({ size = 16, c = color.green }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={2.6}><Path d="M4.5 12.4 9.6 17.5 19.5 7.2" /></Svg>
);
export const IconLock = ({ size = 15, c = color.textLocked }: P) => (
  <Svg {...base(size)} stroke={c}><Rect x="4.5" y="10.5" width="15" height="10" rx="1" /><Path d="M8 10.5V7.4a4 4 0 0 1 8 0v3.1" /></Svg>
);
export const IconStar = ({ size = 15, c = color.blue }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={2.1}><Path d="M12 2.5 15 9l7 .8-5.2 4.7 1.5 6.9L12 18l-6.3 3.4 1.5-6.9L2 9.8 9 9Z" /></Svg>
);
export const IconArrow = ({ size = 17, c = '#FFFFFF' }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={2.1}><Path d="M5 12h13" /><Path d="M13 6.5 18.5 12 13 17.5" /></Svg>
);
export const IconBack = ({ size = 20, c = color.textDim }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={2}><Path d="M15 5.5 8.5 12l6.5 6.5" /></Svg>
);
export const IconAlert = ({ size = 17, c = color.redText }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={2}><Path d="M12 3.5 21.5 20H2.5L12 3.5Z" /><Path d="M12 10v4.4" /><Path d="M12 17.3v.2" /></Svg>
);
export const IconInfo = ({ size = 16, c = color.blue }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={1.9}><Circle cx="12" cy="12" r="9" /><Path d="M12 11v5.5" /><Path d="M12 7.6v.2" /></Svg>
);
export const IconShield = ({ size = 30, c = color.blue }: P) => (
  <Svg {...base(size)} stroke={c} strokeWidth={1.5}>
    <Path d="M12 2.6 20 6v6.4c0 4.4-3.3 7.7-8 9-4.7-1.3-8-4.6-8-9V6Z" /><Path d="M9.2 12.2 11.4 14.4 15.2 9.8" />
  </Svg>
);
