import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { color, type as t } from './tokens';

type Variant = keyof typeof t;

const TONE = {
  default: color.text, dim: color.textDim, muted: color.textMuted,
  blue: color.blue, red: color.redText, green: color.green,
  gold: color.gold, purple: color.purpleSoft, locked: color.textLocked,
} as const;

export function Txt({
  variant = 'body', tone = 'default', style, ...rest
}: TextProps & { variant?: Variant; tone?: keyof typeof TONE }) {
  const base = t[variant] as TextStyle;
  return <RNText {...rest} style={[base, { color: TONE[tone] }, style, scaledLineHeight(base, style)]} />;
}

/**
 * Quem aumenta a fonte de um texto corrido sem dizer a altura de linha herda
 * a altura da variante (21 px no `body`). No iOS isso CORTA o texto: o "ARISE"
 * de 56 px aparecia só como uma fatia de 21 px. A altura passa a acompanhar a
 * fonte, na mesma proporção da variante.
 */
function scaledLineHeight(base: TextStyle, style: TextProps['style']): TextStyle | null {
  if (!base.lineHeight || !base.fontSize) return null;
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (!flat?.fontSize || flat.lineHeight || flat.fontSize <= base.fontSize) return null;
  return { lineHeight: Math.round((flat.fontSize * base.lineHeight) / base.fontSize) };
}

/** Rótulo de HUD: caixa alta, tracking largo. O vocabulário do Sistema. */
export function HudLabel(props: TextProps & { tone?: keyof typeof TONE }) {
  return <Txt variant="hudLabel" {...props} />;
}
