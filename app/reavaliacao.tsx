import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Header, HudLabel, IconStar, Note, RankBadge, Screen, StatBar, Stepper, SystemButton,
  SystemWindow, Txt, color, space,
} from '../src/ui';
import {
  RANK_CRITERIA, daysBetween, nextRank, weeksToRankS,
  type BenchmarkAttempt, type BenchmarkOutcome,
} from '../src/core/engine';
import { benchmarkCooldown, useHunter } from '../src/features/hunter/store';
import { useLocale, useSystemText, useT } from '../src/features/settings/store';
import { exerciseById, exerciseName } from '../src/data/exercises';

/**
 * R7 — Raide de Boss. O rank só muda por teste aprovado em TODOS os critérios.
 * O usuário faz cada teste e registra o que conseguiu com boa forma.
 */
export default function Reavaliacao() {
  const router = useRouter();
  const t = useT();
  const sys = useSystemText();
  const locale = useLocale();
  const h = useHunter();
  const current = h.progression.rank;
  const target = nextRank(current);
  const [attempt, setAttempt] = useState<BenchmarkAttempt>({ pushReps: 0, squatReps: 0, coreSeconds: 0, aerobicMinutes: 0 });
  const [outcome, setOutcome] = useState<BenchmarkOutcome | null>(null);

  const cooldown = benchmarkCooldown(h.lastBenchmarkOn, h.today);
  const c = target ? RANK_CRITERIA[target] : null;
  const name = (id: string) => { const e = exerciseById(id); return e ? exerciseName(e, locale) : id; };

  // Ritmo real: semanas até o rank atual contra a mediana (R7.7).
  const weeksIn = h.startedAt ? daysBetween(h.startedAt, h.today) / 7 : 0;
  const median = RANK_CRITERIA[current].medianWeeks;
  const pace = median > 0 && weeksIn > 0 ? Math.min(2, Math.max(0.5, weeksIn / median)) : 1;

  const submit = async () => setOutcome(await h.submitBenchmark(attempt));

  const rows: { key: keyof BenchmarkAttempt; label: string; required: number; suffix?: string; step: number }[] = c ? [
    { key: 'pushReps', label: name(c.pushExercise), required: c.pushReps, step: 1 },
    { key: 'squatReps', label: name(c.squatExercise), required: c.squatReps, step: 1 },
    { key: 'coreSeconds', label: name(c.coreExercise), required: c.coreSeconds, suffix: 's', step: 5 },
    { key: 'aerobicMinutes', label: t('benchmark.continuousAerobic'), required: c.aerobicMinutes, suffix: 'min', step: 1 },
  ] : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Header backLabel={t('common.back')} onBack={() => router.back()} title={t('benchmark.title')} />

        {!target ? (
          <Note><Txt variant="body" tone="dim">{t('benchmark.maxRank')}</Txt></Note>
        ) : outcome ? (
          <>
            <View style={styles.promo}>
              <HudLabel tone={outcome.passed ? 'blue' : 'red'} style={{ marginBottom: 16 }}>
                {outcome.passed ? t('benchmark.passed') : t('benchmark.failed')}
              </HudLabel>
              <View style={styles.rankRow}>
                <RankBadge rank={current === outcome.targetRank ? current : current} size="sm" dimmed={outcome.passed} />
                {outcome.passed && <Txt tone="blue" style={styles.arrow}>→</Txt>}
                {outcome.passed && <RankBadge rank={outcome.targetRank} size="lg" />}
              </View>
              {outcome.passed && <Txt variant="bodySm" tone="dim" style={{ marginTop: 12, textAlign: 'center' }}>{sys('rankUp')}</Txt>}
            </View>
            <SystemWindow padding={18}>
              <HudLabel tone="muted" style={{ marginBottom: 14 }}>{t('benchmark.results')}</HudLabel>
              {outcome.results.map((r) => {
                const row = rows.find((x) => x.key === r.key)!;
                return (
                  <View key={r.key} style={styles.result}>
                    <View style={styles.resultHead}>
                      <Txt variant="body" style={{ flex: 1 }}>{row.label}</Txt>
                      <Txt variant="bodySm" tone={r.passed ? 'green' : 'red'}>
                        {r.actual}{row.suffix ?? ''} <Txt variant="bodySm" tone="muted">/ {r.required}{row.suffix ?? ''}</Txt>
                      </Txt>
                    </View>
                    <StatBar ratio={r.required ? r.actual / r.required : 0} height={4} glow={false}
                      fill={r.passed ? color.green : color.red} />
                  </View>
                );
              })}
            </SystemWindow>
            {!outcome.passed && <Note><Txt variant="bodySm" tone="dim">{t('benchmark.failedNote')}</Txt></Note>}
            <SystemButton label={t('common.continue')} onPress={() => router.replace('/status')} />
          </>
        ) : cooldown > 0 ? (
          <Note><Txt variant="body" tone="dim">{t('benchmark.cooldown', { days: cooldown })}</Txt></Note>
        ) : (
          <>
            <View style={styles.targetHead}>
              <RankBadge rank={current} size="sm" dimmed />
              <Txt tone="blue" style={styles.arrow}>→</Txt>
              <RankBadge rank={target} size="sm" />
            </View>
            <Txt variant="body" tone="dim">{t('benchmark.instructions')}</Txt>

            <SystemWindow padding={16}>
              <View style={{ gap: 16 }}>
                {rows.map((r) => (
                  <View key={r.key} style={{ gap: 4 }}>
                    <Stepper label={r.label} value={attempt[r.key]} min={0} max={600} step={r.step} suffix={r.suffix}
                      onChange={(v) => setAttempt((a) => ({ ...a, [r.key]: v }))}
                      decLabel={t('common.decrease')} incLabel={t('common.increase')} />
                    <Txt variant="bodySm" tone={attempt[r.key] >= r.required ? 'green' : 'muted'}>
                      {t('benchmark.required', { value: `${r.required}${r.suffix ?? ''}` })}
                    </Txt>
                  </View>
                ))}
              </View>
            </SystemWindow>

            <Note icon={<IconStar />}>
              <Txt variant="bodySm" tone="dim">{t('benchmark.projection', { weeks: weeksToRankS(current, pace) })}</Txt>
            </Note>

            <SystemButton label={t('benchmark.submit')} onPress={submit} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.lg },
  promo: { alignItems: 'center', marginVertical: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  targetHead: { flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center' },
  arrow: { fontSize: 28, color: color.blue },
  result: { marginBottom: 12 },
  resultHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5, gap: 8 },
});
