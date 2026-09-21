import { type ReactNode, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { color } from './tokens';

export type WindowVariant = 'default' | 'highlight' | 'alert' | 'rare';

const BORDER: Record<WindowVariant, string> = {
  default: color.purpleLight,
  highlight: color.blue,
  alert: color.red,
  rare: color.gold,
};

const FILL: Record<WindowVariant, string> = {
  default: color.surface,
  highlight: color.surface,
  alert: '#1D0714',
  rare: '#170F1A',
};

/**
 * A janela do Sistema. Cantos CHANFRADOS, nunca arredondados — é o que
 * separa isto de "mais um app de fitness escuro".
 *
 * RN não tem clip-path, então a moldura é desenhada em SVG atrás do
 * conteúdo: um polígono preenchido com contorno luminoso.
 */
export function SystemWindow({
  children, variant = 'default', chamfer = 14, padding = 16, style, glow = true,
}: {
  children: ReactNode;
  variant?: WindowVariant;
  chamfer?: number;
  padding?: number;
  style?: ViewStyle;
  glow?: boolean;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const stroke = BORDER[variant];

  const points = (w: number, h: number, c: number) =>
    `${c},1 ${w - 1},1 ${w - 1},${h - c} ${w - c},${h - 1} 1,${h - 1} 1,${c}`;

  return (
    <View
      style={[glow && { shadowColor: stroke, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } }, style]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polygon
            points={points(size.w, size.h, chamfer)}
            fill={FILL[variant]}
            stroke={stroke}
            strokeWidth={1}
            strokeOpacity={0.85}
          />
        </Svg>
      )}
      <View style={{ padding }}>{children}</View>
    </View>
  );
}
