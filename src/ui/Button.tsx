import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon } from 'react-native-svg';
import { Txt } from './Text';
import { TOUCH_MIN, color } from './tokens';

type Variant = 'primary' | 'ghost' | 'danger' | 'blue';

const BG: Record<Variant, string> = {
  primary: color.purple, ghost: 'transparent',
  danger: color.red, blue: 'transparent',
};
const BORDER: Record<Variant, string> = {
  primary: color.purple, ghost: color.purpleBorder,
  danger: color.red, blue: color.blueBorder,
};
const FG: Record<Variant, Parameters<typeof Txt>[0]['tone']> = {
  primary: 'default', ghost: 'purple', danger: 'default', blue: 'blue',
};

/** Botão do Sistema. Chanfro em SVG, alvo mínimo de 44pt sempre. */
export function SystemButton({
  label, onPress, variant = 'primary', icon, height = 56, style, disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ReactNode;
  height?: number;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const [w, setW] = useState(0);
  const h = Math.max(height, TOUCH_MIN);
  const c = 13;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
      }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={({ pressed }) => [
        { height: h, opacity: disabled ? 0.45 : pressed ? 0.8 : 1, justifyContent: 'center' },
        variant === 'primary' && {
          shadowColor: color.purple, shadowOpacity: 0.55,
          shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    >
      {w > 0 && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polygon
            points={`${c},0 ${w},0 ${w},${h - c} ${w - c},${h} 0,${h} 0,${c}`}
            fill={BG[variant]}
            stroke={BORDER[variant]}
            strokeWidth={1}
          />
        </Svg>
      )}
      <View style={styles.row}>
        <Txt variant="hudLabel" tone={FG[variant]} style={styles.label}>{label}</Txt>
        {icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontSize: 14, letterSpacing: 2.6 },
});
