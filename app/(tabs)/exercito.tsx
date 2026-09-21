import { ScrollView, StyleSheet, View } from 'react-native';
import {
  HudLabel, IconLock, IconShield, Screen, StatBar, SystemWindow, Txt,
  color, space,
} from '../../src/ui';
import { GRADE_LABEL, SHADOWS } from '../../src/data/shadows';
import type { Shadow } from '../../src/core/types';

const GRADE_COLOR: Record<Shadow['grade'], 'blue' | 'purple' | 'red' | 'gold'> = {
  soldier: 'blue', elite: 'purple', knight: 'red',
  commander: 'red', marshal: 'gold', general: 'gold',
};

export default function ExercitoScreen() {
  const unlocked = SHADOWS.filter((s) => s.unlockedAt);
  const next = SHADOWS.find((s) => !s.unlockedAt && s.grade === 'general');

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Txt variant="title">Exército de Sombras</Txt>
          <Txt variant="bodySm" tone="dim" style={{ marginTop: 4 }}>
            {unlocked.length} de {SHADOWS.length} extraídas · cada uma dá um benefício real
          </Txt>
        </View>

        <View style={styles.grid}>
          {SHADOWS.map((s) => {
            const on = !!s.unlockedAt;
            const tone = GRADE_COLOR[s.grade];
            const accent = on
              ? tone === 'blue' ? color.blue
                : tone === 'purple' ? color.purpleSoft
                  : tone === 'red' ? color.redText : color.gold
              : color.textLocked;

            return (
              <View key={s.id} style={styles.cell}>
                <View style={[
                  styles.card,
                  { borderColor: on ? accent : 'rgba(139,92,246,0.18)' },
                  on && { shadowColor: accent, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
                  !on && { backgroundColor: color.surfaceAlt },
                ]}>
                  {on ? <IconShield c={accent} /> : <IconLock size={26} />}
                  <Txt variant="bodySm" tone={on ? 'default' : 'locked'}
                    numberOfLines={1} style={styles.cardName}>
                    {s.namePt}
                  </Txt>
                  <Txt variant="hudSmall" tone={on ? 'blue' : 'locked'} style={{ fontSize: 10 }}>
                    {GRADE_LABEL[s.grade]}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>

        {/* R10.2 — a vitrine mostra o BENEFÍCIO, não só o troféu.
            É o que separa conquista útil de medalha vazia. */}
        <HudLabel tone="muted">Benefícios ativos</HudLabel>
        {unlocked.slice(0, 4).map((s) => (
          <View key={s.id} style={styles.perkRow}>
            <Txt variant="bodySm" tone="purple" style={styles.perkName}>{s.namePt}</Txt>
            <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>{s.perkPt}</Txt>
          </View>
        ))}

        {next && (
          <SystemWindow variant="rare" padding={16}>
            <View style={styles.nextRow}>
              <View style={styles.nextIcon}>
                <IconShield size={26} c={color.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <HudLabel tone="gold" style={{ fontSize: 10 }}>Próxima · General</HudLabel>
                <Txt variant="bodyStrong" style={{ marginVertical: 5 }}>{next.namePt}</Txt>
                <StatBar ratio={0.31} height={4} fill={color.gold} glow={false} />
                <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
                  {next.conditionPt} · 31%
                </Txt>
              </View>
            </View>
          </SystemWindow>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4.5 },
  cell: { width: '33.333%', paddingHorizontal: 4.5, paddingBottom: 9 },
  card: {
    alignItems: 'center', paddingVertical: 13, paddingHorizontal: 8,
    backgroundColor: color.surface, borderWidth: 1,
  },
  cardName: { fontSize: 12.5, marginTop: 8, marginBottom: 2 },
  perkRow: { flexDirection: 'row', gap: 10, paddingVertical: 7 },
  perkName: { width: 92, fontSize: 12.5 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextIcon: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.45)',
  },
});
