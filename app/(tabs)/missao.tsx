import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconCheck, IconClock, Screen, StatBar, SystemButton, SystemWindow, Txt, color, font, space,
} from '../../src/ui';
import { useHunter } from '../../src/features/hunter/store';
import { useLocale, useSystemText, useT } from '../../src/features/settings/store';
import { useCountdown } from '../../src/features/common/useCountdown';
import { useBilling } from '../../src/features/billing/store';
import { exerciseById, exerciseName, systemName } from '../../src/data/exercises';

const SUFFIX = { reps: '', seconds: 's', minutes: 'min', meters: 'm' } as const;

export default function MissaoScreen() {
  const router = useRouter();
  const t = useT();
  const sys = useSystemText();
  const locale = useLocale();
  const { quest, completeToday } = useHunter();
  const left = useCountdown(quest?.deadline);
  // R13.5 — sem direito de acesso, a missão fica visível mas não inicia.
  const canTrain = useBilling((s) => s.entitlement?.canTrain ?? true);
  const openSession = (id: string) => {
    if (!canTrain) router.push('/paywall');
    else router.push({ pathname: '/sessao', params: { id } });
  };

  if (!quest) return <Screen><View /></Screen>;

  const done = quest.status === 'completed';
  const started = quest.objectives.some((o) => o.actualValue > 0);
  const next = quest.objectives.find((o) => o.actualValue < o.targetValue);

  const finish = async () => {
    const c = await completeToday();
    if (c) router.push('/levelup');
  };

  const endDay = () => Alert.alert(t('quest.endSession'), t('quest.endSessionNote'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('quest.endSession'), onPress: () => { void finish(); } },
  ]);

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <HudLabel style={{ fontSize: 17, letterSpacing: 2.4 }} accessibilityRole="header">{t('quest.daily')}</HudLabel>
        {!canTrain && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/paywall')}>
            <SystemWindow variant="alert" padding={14}>
              <HudLabel tone="red">{t('billing.lockedTitle')}</HudLabel>
              <Txt variant="bodySm" tone="dim" style={{ marginTop: 6 }}>{t('billing.lockedNote')}</Txt>
            </SystemWindow>
          </Pressable>
        )}

        <View>
          <HudLabel tone="muted">{t('quest.questLabel')}</HudLabel>
          <Txt variant="title" style={styles.questName}>{t('quest.canonicalName')}</Txt>
        </View>

        {quest.isRestDay ? (
          <View style={{ gap: space.md }}>
            <Txt variant="body" tone="dim">{sys('restDay')}</Txt>
            {!done && <SystemButton label={t('status.honorRest')} onPress={finish} />}
            {done && <Txt variant="body" tone="green">{t('status.questDone', { xp: quest.xpAwarded ?? 0 })}</Txt>}
          </View>
        ) : (
          <>
            {!done && (
              <View style={styles.deadline}>
                <View style={styles.deadlineLabel}>
                  <IconClock />
                  <Txt variant="bodySm" tone="dim" style={{ fontSize: 13 }}>{t('quest.deadline')}</Txt>
                </View>
                <Txt variant="stat" tone="red" style={{ fontSize: 19 }}>{left.hours}h {left.minutes}min</Txt>
              </View>
            )}
            {quest.isDeload && <Txt variant="bodySm" tone="blue">{sys('deloadWeek')}</Txt>}

            {quest.objectives.map((o) => {
              const ex = exerciseById(o.exerciseId);
              const ok = o.actualValue >= o.targetValue;
              return (
                <Pressable
                  key={o.exerciseId}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex ? exerciseName(ex, locale) : o.exerciseId}. ${o.actualValue} ${t('common.of')} ${o.targetValue}`}
                  disabled={done}
                  onPress={() => openSession(o.exerciseId)}
                  style={[styles.objective, ok ? styles.objectiveDone : styles.objectivePending]}
                >
                  <View style={styles.objectiveHead}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Txt variant="bodyStrong">{ex ? exerciseName(ex, locale) : o.exerciseId}</Txt>
                        {ok && <IconCheck />}
                      </View>
                      <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>
                        {ok && o.rpe ? `${t('common.done')} · RPE ${o.rpe}` : ex ? systemName(ex, locale) : ''}
                      </Txt>
                    </View>
                    <Txt variant="stat" tone={ok ? 'green' : 'default'}>
                      {o.actualValue}
                      <Txt variant="stat" tone={ok ? 'green' : 'muted'} style={{ fontSize: 14 }}>
                        /{o.targetValue}{SUFFIX[o.unit]}
                      </Txt>
                    </Txt>
                  </View>
                  <StatBar ratio={o.targetValue ? o.actualValue / o.targetValue : 0} glow={false}
                    fill={ok ? color.green : color.purpleLight} />
                </Pressable>
              );
            })}

            {done ? (
              <Txt variant="body" tone="green">{t('status.questDone', { xp: quest.xpAwarded ?? 0 })}</Txt>
            ) : (
              <>
                <Txt variant="bodySm" tone="dim">{t('quest.rewardDetail')}</Txt>
                {next ? (
                  <SystemButton label={started ? t('quest.resume') : t('quest.start')}
                    onPress={() => openSession(next.exerciseId)} />
                ) : (
                  <SystemButton label={t('quest.finishDay')} onPress={finish} />
                )}
                {started && next && (
                  <SystemButton label={t('quest.endSession')} variant="ghost" height={46} onPress={endDay} />
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  questName: { fontSize: 19, marginTop: 4, letterSpacing: 0.4, fontFamily: font.display },
  deadline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 15, backgroundColor: color.redDim, borderWidth: 1, borderColor: color.redBorder,
  },
  deadlineLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  objective: { padding: 15, borderWidth: 1, borderLeftWidth: 3 },
  objectivePending: { backgroundColor: color.surface, borderColor: color.line, borderLeftColor: color.purpleLight },
  objectiveDone: { backgroundColor: color.greenDim, borderColor: color.greenBorder, borderLeftColor: color.green },
  objectiveHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
