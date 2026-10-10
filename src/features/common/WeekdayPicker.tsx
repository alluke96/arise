import { Pressable, StyleSheet, View } from 'react-native';
import { Txt, color, font } from '../../ui';
import { useT } from '../settings/store';
import type { TKey } from '../../core/i18n';

/** Segunda primeiro: é como a semana de treino é pensada no Brasil. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Sete casas, uma por dia da semana. Marcado = dia de treino. */
export function WeekdayPicker({ value, onToggle }: { value: readonly number[]; onToggle: (day: number) => void }) {
  const t = useT();
  return (
    <View style={styles.row} accessibilityRole="none">
      {ORDER.map((d) => {
        const on = value.includes(d);
        const label = t(`weekdays.${d}` as TKey);
        return (
          <Pressable
            key={d}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={label}
            onPress={() => onToggle(d)}
            style={[styles.day, on ? styles.on : styles.off]}
          >
            <Txt variant="bodySm" tone={on ? 'default' : 'dim'} style={styles.label}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  on: { backgroundColor: color.purple, borderColor: color.purpleLight },
  off: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  label: { fontFamily: font.displayMedium, fontSize: 12 },
});
