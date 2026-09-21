import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconBack, IconStar, RankBadge, Screen, StatBar, SystemButton,
  SystemWindow, Txt, color, space,
} from '../src/ui';
import { evaluateBenchmark, weeksToRankS } from '../src/core/engine';
import { useProgression } from '../src/features/progression/store';

const ATTEMPT = { pushReps: 13, squatReps: 21, coreSeconds: 38, aerobicMinutes: 24 };

const LABEL: Record<keyof typeof ATTEMPT, { name: string; unit: string }> = {
  pushReps: { name: 'Flexões inclinadas', unit: '' },
  squatReps: { name: 'Agachamentos livres', unit: '' },
  coreSeconds: { name: 'Prancha de joelho', unit: 's' },
  aerobicMinutes: { name: 'Caminhada contínua', unit: 'min' },
};

const BODY = [
  { label: 'Peso', value: '89,1', unit: 'kg', delta: '−3,3 kg', tone: 'green' as const },
  { label: 'Cintura', value: '97', unit: 'cm', delta: '−4 cm', tone: 'green' as const },
  { label: 'Passos/dia', value: '6.840', unit: '', delta: 'meta 7.000', tone: 'blue' as const },
];

export default function Reavaliacao() {
  const router = useRouter();
  const { progression } = useProgression();

  // Benchmark avaliado pelo MOTOR — a tela não decide nada (R7.2).
  const outcome = evaluateBenchmark('E', ATTEMPT);
  const weeks = weeksToRankS(outcome.passed ? outcome.targetRank : 'E', 0.82);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar"
            onPress={() => router.back()} hitSlop={12}>
            <IconBack />
          </Pressable>
          <HudLabel tone="muted" style={{ fontSize: 11 }}>Raide de Boss · semana 6</HudLabel>
        </View>

        <View style={styles.promo}>
          <HudLabel tone="blue" style={{ marginBottom: 16 }}>
            {outcome.passed ? 'Reavaliação aprovada' : 'Reavaliação reprovada'}
          </HudLabel>
          <View style={styles.rankRow}>
            <RankBadge rank="E" size="sm" dimmed />
            <Txt tone="blue" style={styles.arrow}>→</Txt>
            <RankBadge rank={outcome.targetRank} size="lg" />
          </View>
        </View>

        <SystemWindow padding={18}>
          <HudLabel tone="muted" style={{ marginBottom: 14 }}>Resultados do teste</HudLabel>
          {outcome.results.map((r) => (
            <View key={r.key} style={styles.result}>
              <View style={styles.resultHead}>
                <Txt variant="body">{LABEL[r.key].name}</Txt>
                <Txt variant="bodySm" tone={r.passed ? 'green' : 'red'}>
                  {r.actual}{LABEL[r.key].unit}{' '}
                  <Txt variant="bodySm" tone="muted">/ {r.required}{LABEL[r.key].unit}</Txt>
                </Txt>
              </View>
              <StatBar ratio={r.actual / r.required} height={4} glow={false}
                fill={r.passed ? color.green : color.red} />
            </View>
          ))}
        </SystemWindow>

        <View style={styles.bodyRow}>
          {BODY.map((b) => (
            <View key={b.label} style={styles.bodyCard}>
              <Txt variant="bodySm" tone="muted" style={{ fontSize: 11 }}>{b.label}</Txt>
              <Txt variant="stat" style={{ fontSize: 17, marginTop: 4 }}>
                {b.value}<Txt variant="stat" tone="muted" style={{ fontSize: 11 }}>{b.unit}</Txt>
              </Txt>
              <Txt variant="bodySm" tone={b.tone} style={{ fontSize: 11, marginTop: 2 }}>{b.delta}</Txt>
            </View>
          ))}
        </View>

        {/* R7.7 — projeção recalculada com o ritmo REAL, não com a curva genérica. */}
        <View style={styles.projection}>
          <IconStar />
          <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
            Projeção recalculada com <Txt variant="bodySm" tone="default">seus dados reais</Txt>,
            não com a curva genérica: Rank S em <Txt variant="bodySm" tone="default">{weeks} semanas</Txt>.
          </Txt>
        </View>

        <SystemButton label="Ver Zona de Penalidade" variant="ghost" height={50}
          onPress={() => router.push('/penalidade')} />
        <SystemButton
          label={outcome.passed ? `Avançar para o Rank ${outcome.targetRank}` : 'Voltar ao treino'}
          onPress={() => router.replace('/status')}
        />
        <Txt variant="bodySm" tone="muted" style={{ textAlign: 'center' }}>
          Rank atual no perfil: {progression.rank} · próxima reavaliação em 6 semanas
        </Txt>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promo: { alignItems: 'center', marginVertical: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  arrow: { fontSize: 28, color: color.blue },
  result: { marginBottom: 12 },
  resultHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 },
  bodyRow: { flexDirection: 'row', gap: 9 },
  bodyCard: { flex: 1, padding: 12, backgroundColor: color.surface, borderWidth: 1, borderColor: color.purpleBorder },
  projection: {
    flexDirection: 'row', gap: 11, alignItems: 'flex-start', padding: 14,
    backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
});
