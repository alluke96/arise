import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon } from 'react-native-svg';
import { useState } from 'react';
import { Txt } from './Text';
import { color } from './tokens';

/**
 * R5.1 — o contador é a maior área tocável do app. O usuário está suado,
 * ofegante e com o celular no chão: o alvo é a tela quase inteira, não um
 * botão de 44pt.
 */
export function RepCounter({
  value, target, unit, onIncrement,
}: {
  value: number;
  target: number;
  unit: string;
  onIncrement: () => void;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const c = 22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Registrar repetição. ${value} de ${target} ${unit}`}
      accessibilityValue={{ min: 0, max: target, now: value }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onIncrement();
      }}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={({ pressed }) => [styles.root, { opacity: pressed ? 0.85 : 1 }]}
    >
      {size.w > 0 && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polygon
            points={`${c},1 ${size.w - 1},1 ${size.w - 1},${size.h - c} ${size.w - c},${size.h - 1} 1,${size.h - 1} 1,${c}`}
            fill="#130A28" stroke={color.blue} strokeWidth={2}
          />
        </Svg>
      )}
      <View style={styles.inner}>
        <Txt variant="statLg" style={styles.value}>{value}</Txt>
        <Txt variant="body" tone="muted" style={styles.of}>de {target} {unit}</Txt>
        <Txt variant="hudLabel" tone="blue" style={styles.hint}>Toque a cada repetição</Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    shadowColor: color.blue, shadowOpacity: 0.35,
    shadowRadius: 34, shadowOffset: { width: 0, height: 0 },
  },
  inner: { alignItems: 'center', paddingVertical: 26 },
  value: { fontSize: 82, lineHeight: 84 },
  of: { fontSize: 17, marginTop: 2 },
  hint: { marginTop: 14 },
});
