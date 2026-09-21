import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import type { Attribute } from '../core/types';
import { color } from './tokens';

const AXES: { key: Attribute; label: string }[] = [
  { key: 'STR', label: 'FOR' }, { key: 'AGI', label: 'AGI' },
  { key: 'VIT', label: 'VIT' }, { key: 'PER', label: 'PER' },
  { key: 'INT', label: 'INT' },
];

export function RadarChart({
  values, size = 128,
}: { values: Record<Attribute, number>; size?: number }) {
  const cx = size / 2;
  const cy = size / 2 + 2;
  const r = size * 0.4;

  const point = (i: number, ratio: number) => {
    const angle = (-90 + i * 72) * (Math.PI / 180);
    return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio] as const;
  };
  const ring = (ratio: number) =>
    AXES.map((_, i) => point(i, ratio).join(',')).join(' ');

  const data = AXES.map((a, i) =>
    point(i, Math.min(Math.max(values[a.key], 0), 100) / 100).join(','),
  ).join(' ');

  return (
    <Svg width={size} height={size + 8} accessibilityLabel="Radar de atributos">
      {[1, 0.66, 0.33].map((rr) => (
        <Polygon key={rr} points={ring(rr)} fill="none"
          stroke={color.purpleLight} strokeOpacity={0.22} strokeWidth={1} />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, 1);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke={color.purpleLight} strokeOpacity={0.2} strokeWidth={1} />;
      })}
      <Polygon points={data} fill={color.blue} fillOpacity={0.2}
        stroke={color.blue} strokeWidth={1.6} />
      {AXES.map((a, i) => {
        const [x, y] = point(i, Math.min(Math.max(values[a.key], 0), 100) / 100);
        return <Circle key={a.key} cx={x} cy={y} r={2.6} fill={color.blue} />;
      })}
      {AXES.map((a, i) => {
        const [x, y] = point(i, 1.22);
        return (
          <SvgText key={a.label} x={x} y={y + 3} fill={color.textDim}
            fontSize={9} textAnchor="middle">
            {a.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
