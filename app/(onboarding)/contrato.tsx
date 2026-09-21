import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconArrow, IconStar, RankBadge, Screen, StatBar, SystemButton,
  SystemWindow, Txt, color, space,
} from '../../src/ui';
import { RANK_CRITERIA, weeksToRankS } from '../../src/core/engine';

const TODAY = [
  { value: '10', label: 'flexões na parede' },
  { value: '15', label: 'agachamentos na cadeira' },
  { value: '10', label: 'minutos de caminhada' },
];

const GOAL = [
  { value: '100', label: 'flexões' }, { value: '100', label: 'abdominais' },
  { value: '100', label: 'agachamentos' }, { value: '10 km', label: 'de corrida' },
];

export default function Contrato() {
  const router = useRouter();
  const weeks = weeksToRankS('E');

  return (
    <Screen tone="ritual">
      <View style={styles.root}>
        <SystemWindow chamfer={17} padding={22}>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <HudLabel tone="blue">Missão diária gerada</HudLabel>
          </View>

          <View style={styles.rankRow}>
            <RankBadge rank="E" size="sm" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodySm" tone="dim">Caçador registrado</Txt>
              <Txt variant="title" style={{ fontSize: 21, marginVertical: 6 }}>NÍVEL 1</Txt>
              <StatBar ratio={0.04} height={4} glow={false} />
            </View>
          </View>

          <HudLabel tone="muted" style={styles.section}>Sua missão de hoje</HudLabel>
          {TODAY.map((t) => (
            <View key={t.label} style={styles.todayRow}>
              <Txt variant="stat" tone="blue" style={styles.todayValue}>{t.value}</Txt>
              <Txt variant="body">{t.label}</Txt>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.goalHeader}>
            <IconStar c={color.redText} />
            <HudLabel tone="red">Objetivo final — Rank S</HudLabel>
          </View>
          <View style={styles.goalGrid}>
            {GOAL.map((g) => (
              <View key={g.label} style={styles.goalCard}>
                <Txt variant="stat" tone="red" style={{ fontSize: 21 }}>{g.value}</Txt>
                <Txt variant="bodySm" tone="dim">{g.label}</Txt>
              </View>
            ))}
          </View>

          <View style={styles.eta}>
            <Txt variant="bodySm" tone="dim">Tempo estimado até lá</Txt>
            <Txt variant="bodyStrong" style={{ fontFamily: 'ChakraPetch_600SemiBold', fontSize: 17 }}>
              {weeks} semanas
            </Txt>
          </View>
          <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
            {RANK_CRITERIA.S.titlePt} — a missão canônica só é liberada a partir do Rank A.
          </Txt>
        </SystemWindow>

        <View style={styles.actions}>
          <SystemButton
            label="Aceitar o contrato"
            icon={<IconArrow />}
            height={58}
            onPress={() => router.replace('/(tabs)')}
          />
          <Txt variant="bodySm" tone="muted" style={styles.note}>
            A missão cresce no máximo 10% por semana.{'\n'}
            O Sistema recalibra sozinho se ficar pesado.
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 28, gap: 22 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 6, height: 6, backgroundColor: color.blue, shadowColor: color.blue, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  section: { marginBottom: 12 },
  todayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 13,
    backgroundColor: color.purpleDim, borderLeftWidth: 2, borderLeftColor: color.blue, marginBottom: 9,
  },
  todayValue: { width: 34, fontSize: 19 },
  divider: { height: 1, backgroundColor: color.line, marginVertical: 18 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalCard: {
    width: '47.5%', padding: 10, backgroundColor: 'rgba(255,59,92,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,59,92,0.25)',
  },
  eta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 13, marginTop: 18, backgroundColor: color.blueDim,
    borderLeftWidth: 2, borderLeftColor: color.blue,
  },
  actions: { gap: space.md },
  note: { textAlign: 'center', fontSize: 11, lineHeight: 17 },
});
