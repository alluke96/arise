import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconStar, Screen, SystemButton, SystemWindow, Txt, color, font, space,
} from '../src/ui';
import { useProgression } from '../src/features/progression/store';

const PARTICLES = [
  { left: 52, top: 150, size: 3, c: color.blue },
  { left: 312, top: 212, size: 4, c: color.purpleLight },
  { left: 96, top: 328, size: 2, c: color.blue },
  { left: 286, top: 392, size: 3, c: color.purpleSoft },
];

export default function LevelUp() {
  const router = useRouter();
  const { progression } = useProgression();
  const from = progression.level;
  const to = from + 1;

  return (
    <Screen tone="ritual">
      {PARTICLES.map((p, i) => (
        <View key={i} pointerEvents="none" style={[styles.particle, {
          left: p.left, top: p.top, width: p.size, height: p.size,
          backgroundColor: p.c, shadowColor: p.c,
        }]} />
      ))}

      <View style={styles.root}>
        <View style={styles.head}>
          <HudLabel tone="green">Missão concluída</HudLabel>
          <Txt variant="bodySm" tone="dim" style={{ marginTop: 5 }}>
            A Preparação Para Se Tornar Poderoso
          </Txt>
        </View>

        <View style={styles.center}>
          <Txt style={styles.title}>LEVEL UP</Txt>
          <View style={styles.rule} />
          <View style={styles.levels}>
            <Txt variant="statLg" tone="locked" style={{ fontSize: 42 }}>{from}</Txt>
            <Txt tone="blue" style={styles.arrow}>→</Txt>
            <Txt variant="statLg" style={styles.newLevel}>{to}</Txt>
          </View>
        </View>

        <SystemWindow padding={18}>
          <HudLabel tone="muted" style={{ marginBottom: 14 }}>Recompensas</HudLabel>

          <Reward label="Pontos de atributo" value="+3" tone="blue" />
          <Reward label="Experiência" value="+180 XP" tone="purple" />
          <Reward label="Caixa de loot" value="×1" tone="gold" />

          <View style={styles.shadow}>
            <HudLabel tone="green" style={{ fontSize: 10.5 }}>Nova sombra extraída</HudLabel>
            <Txt variant="body" style={{ marginTop: 4 }}>
              <Txt variant="bodyStrong">Vigia</Txt>
              <Txt variant="body" tone="muted"> · Elite</Txt> — ganhou +1 Pedra de Recuperação por mês.
            </Txt>
          </View>
        </SystemWindow>

        <View style={styles.actions}>
          <SystemButton label="Ver sombra" variant="ghost" height={54} style={{ flex: 1 }}
            onPress={() => router.replace('/exercito')} />
          <SystemButton label="Continuar" height={54} style={{ flex: 1 }}
            onPress={() => router.replace('/status')} />
        </View>
      </View>
    </Screen>
  );
}

function Reward({ label, value, tone }: {
  label: string; value: string; tone: 'blue' | 'purple' | 'gold';
}) {
  const c = tone === 'blue' ? color.blue : tone === 'purple' ? color.purpleSoft : color.gold;
  return (
    <View style={styles.rewardRow}>
      <View style={[styles.rewardIcon, { borderColor: c }]}>
        <IconStar size={16} c={c} />
      </View>
      <Txt variant="body" style={{ flex: 1 }}>{label}</Txt>
      <Txt variant="stat" tone={tone} style={{ fontSize: 17 }}>{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28, gap: space.lg },
  particle: { position: 'absolute', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  head: { alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: font.displayBold, fontSize: 44, color: '#FFFFFF', letterSpacing: 6,
    textShadowColor: 'rgba(167,139,250,0.9)', textShadowRadius: 28,
  },
  rule: {
    width: 180, height: 1, backgroundColor: color.blue, marginVertical: 18,
    shadowColor: color.blue, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  levels: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  arrow: { fontSize: 26, fontFamily: font.display },
  newLevel: { fontSize: 64, textShadowColor: 'rgba(125,211,252,0.7)', textShadowRadius: 22 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 11 },
  rewardIcon: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  shadow: {
    marginTop: 5, padding: 12,
    backgroundColor: color.greenDim, borderLeftWidth: 2, borderLeftColor: color.green,
  },
  actions: { flexDirection: 'row', gap: 9 },
});
