import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconCheck, IconInfo, Note, Screen, StatBar, SystemButton, SystemWindow, Txt, color, font, space,
} from '../src/ui';
import { PENALTY_DURATION_SECONDS } from '../src/core/engine';
import { useHunter } from '../src/features/hunter/store';
import { useLocale, useT } from '../src/features/settings/store';
import { exerciseById, exerciseName } from '../src/data/exercises';

/** 4 minutos em RPE 2–3 (R8.2): mobilidade e caminhada no lugar. */
const STEPS: { id: string; seconds: number }[] = [
  { id: 'cat_camel', seconds: 60 },
  { id: 'march_in_place', seconds: 90 },
  { id: 'chest_stretch', seconds: 45 },
  { id: 'breathing', seconds: 45 },
];

export default function Penalidade() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { progression, penaltyOpenFor, clearPenalty, useStone } = useHunter();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || elapsed >= PENALTY_DURATION_SECONDS) return;
    const tick = setTimeout(() => setElapsed((e) => e + 1), 1000);
    return () => clearTimeout(tick);
  }, [running, elapsed]);

  if (!penaltyOpenFor) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Txt variant="body" tone="dim" style={{ textAlign: 'center' }}>{t('penalty.noneOpen')}</Txt>
          <SystemButton label={t('common.back')} onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const remaining = PENALTY_DURATION_SECONDS - elapsed;
  const finished = remaining <= 0;
  let acc = 0;

  return (
    <Screen tone="penalty">
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.signal}>
          <View style={styles.dot} />
          <HudLabel tone="red" style={{ fontSize: 11 }}>{t('penalty.missedQuest')}</HudLabel>
        </View>

        <Txt style={styles.title} accessibilityRole="header">{t('penalty.title')}</Txt>
        <Txt variant="body" style={styles.lede}>{t('penalty.intro', { minutes: 4 })}</Txt>

        <SystemWindow variant="alert" chamfer={17} padding={24}>
          <View style={{ alignItems: 'center' }}>
            <HudLabel tone="red" style={{ fontSize: 11 }}>{t('penalty.timeRemaining')}</HudLabel>
            <Txt style={styles.timer} accessibilityLiveRegion="polite">
              {String(Math.floor(Math.max(0, remaining) / 60)).padStart(2, '0')}:{String(Math.max(0, remaining) % 60).padStart(2, '0')}
            </Txt>
            <View style={{ width: '100%' }}>
              <StatBar ratio={elapsed / PENALTY_DURATION_SECONDS} fill={color.red} />
            </View>
          </View>
        </SystemWindow>

        <View style={styles.steps}>
          {STEPS.map((s) => {
            const start = acc;
            acc += s.seconds;
            const isDone = elapsed >= acc;
            const active = !isDone && elapsed >= start;
            const ex = exerciseById(s.id);
            const name = ex ? exerciseName(ex, locale) : t('penalty.breathing');
            return (
              <View key={s.id} style={[styles.step, isDone ? styles.stepDone : active ? styles.stepActive : styles.stepIdle]}>
                {isDone ? <IconCheck /> : <View style={[styles.bullet, active && styles.bulletActive]} />}
                <Txt variant="body" tone={isDone || active ? 'default' : 'muted'} style={{ flex: 1, fontSize: 14.5 }}>{name}</Txt>
                <Txt variant="bodySm" tone={active ? 'red' : 'muted'} style={{ fontFamily: font.displayMedium }}>{s.seconds}s</Txt>
              </View>
            );
          })}
        </View>

        {/* R8.5 — a garantia mais importante do app, dita onde mais precisa ser lida. */}
        <Note icon={<IconInfo />}>
          <Txt variant="bodySm" tone="dim">{t('penalty.reassurance', { days: progression.streakCurrent })}</Txt>
        </Note>

        {finished ? (
          <SystemButton label={t('penalty.survive')} variant="danger" height={58}
            onPress={async () => { await clearPenalty(); router.replace('/status'); }} />
        ) : (
          <SystemButton label={running ? t('quest.pause') : t('penalty.start')} variant="danger" height={58}
            onPress={() => setRunning((r) => !r)} />
        )}
        <SystemButton
          label={t('penalty.useStone', { count: progression.recoveryStones })}
          variant="ghost" height={46}
          disabled={progression.recoveryStones <= 0}
          onPress={async () => { if (await useStone()) router.replace('/status'); }}
        />
        {progression.recoveryStones <= 0 && (
          <Txt variant="bodySm" tone="muted" style={{ textAlign: 'center' }}>{t('penalty.noStones')}</Txt>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: space.md },
  empty: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 7, height: 7, backgroundColor: color.red, shadowColor: color.red, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  title: {
    fontFamily: font.displayBold, fontSize: 37, lineHeight: 39, color: '#FFFFFF', letterSpacing: 1.8,
    marginTop: 14, textShadowColor: 'rgba(255,59,92,0.6)', textShadowRadius: 24,
  },
  lede: { color: '#E4C8D0', fontSize: 15, lineHeight: 24 },
  timer: {
    fontFamily: font.displayBold, fontSize: 66, lineHeight: 70, color: '#FFFFFF',
    marginVertical: 12, textShadowColor: 'rgba(255,59,92,0.7)', textShadowRadius: 26,
  },
  steps: { gap: 9, marginTop: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 15, borderWidth: 1 },
  stepDone: { backgroundColor: color.greenDim, borderColor: color.greenBorder },
  stepActive: { backgroundColor: 'rgba(255,59,92,0.09)', borderColor: 'rgba(255,59,92,0.42)' },
  stepIdle: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,107,133,0.20)' },
  bullet: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,107,133,0.35)' },
  bulletActive: { borderColor: color.red },
});
