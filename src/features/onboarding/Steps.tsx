import { Pressable, StyleSheet, View } from 'react-native';
import { HudLabel } from '../../ui/Text';
import { color } from '../../ui/tokens';

export const TOTAL_STEPS = 7;

export function Steps({ current, onBack, badge }: {
  current: number;
  onBack?: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <HudLabel tone="muted" style={{ fontSize: 11 }}>
          Passo {current} de {TOTAL_STEPS}
        </HudLabel>
        {badge ?? (onBack && (
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} hitSlop={12}>
            <HudLabel tone="blue" style={{ fontSize: 11 }}>Voltar</HudLabel>
          </Pressable>
        ))}
      </View>
      <View style={styles.bars}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[
            styles.bar,
            i < current ? styles.barOn : styles.barOff,
            i === current - 1 && styles.barActive,
          ]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 11 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bars: { flexDirection: 'row', gap: 5 },
  bar: { flex: 1, height: 3 },
  barOn: { backgroundColor: color.blue },
  barOff: { backgroundColor: 'rgba(139,92,246,0.24)' },
  barActive: { shadowColor: color.blue, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
});
