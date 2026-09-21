import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
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
  return <RNText {...rest} style={[t[variant] as TextStyle, { color: TONE[tone] }, style]} />;
}

/** Rótulo de HUD: caixa alta, tracking largo. O vocabulário do Sistema. */
export function HudLabel(props: TextProps & { tone?: keyof typeof TONE }) {
  return <Txt variant="hudLabel" {...props} />;
}
