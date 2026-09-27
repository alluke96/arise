import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconArrow, IconStar, RankBadge, Screen, StatBar, SystemButton, SystemWindow, Txt, color, space,
} from '../../src/ui';
import { useOnboarding } from '../../src/features/onboarding/store';
import { useHunter } from '../../src/features/hunter/store';
import { useLocale, useT } from '../../src/features/settings/store';
import { requestNotificationPermission, syncNotifications } from '../../src/features/notifications/adapter';
import {
  addDays, evaluateParq, generateDailyQuest, initialRank, weeksToRankS, INITIAL_PROGRESSION_FOR,
} from '../../src/core/engine';
import { EXERCISES, exerciseById, exerciseName } from '../../src/data/exercises';
import type { TKey } from '../../src/core/i18n';

const GOAL = [
  { value: '100', key: 'goalPush' }, { value: '100', key: 'goalSitups' },
  { value: '100', key: 'goalSquats' }, { value: '10 km', key: 'goalRun' },
] as const;

export default function Contrato() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { draft, parq, baseline, commit } = useOnboarding();
  const boot = useHunter((s) => s.boot);
  const today = useHunter((s) => s.today);
  const [saving, setSaving] = useState(false);

  const rank = initialRank(baseline);
  const screening = evaluateParq({ answers: parq, limitations: draft.limitations, date: today });

  // A missão mostrada aqui é a que o motor gera de verdade para estas respostas.
  const preview = useMemo(() => {
    let day = today;
    for (let i = 0; i < 7; i++) {
      const q = generateDailyQuest({
        profile: draft, progression: INITIAL_PROGRESSION_FOR(rank), screening,
        history: [], painLog: [], catalog: EXERCISES, date: day, weekIndex: 0, lastWeek: {},
        sleepHours: 7, soreness: 0, consecutiveFailures: 0,
        isTrainingDay: true,
      });
      if (q.objectives.length) return q;
      day = addDays(day, 1);
    }
    return null;
  }, [draft, rank, screening, today]);

  const accept = async () => {
    setSaving(true);
    try {
      await commit();
      await requestNotificationPermission();
      await boot();
      const { quest, profile } = useHunter.getState();
      if (quest && profile) void syncNotifications(quest, profile.preferredTime);
      router.replace('/status');
    } finally {
      setSaving(false);
    }
  };

  const unit = (u: string) => (u === 'seconds' ? t('common.seconds') : u === 'minutes' ? t('common.minutes') : '');

  return (
    <Screen tone="ritual">
      <ScrollView contentContainerStyle={styles.root}>
        <SystemWindow chamfer={17} padding={22}>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <HudLabel tone="blue">{t('onboarding.contractGenerated')}</HudLabel>
          </View>

          <View style={styles.rankRow}>
            <RankBadge rank={rank} size="sm" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodySm" tone="dim">{draft.hunterName.toUpperCase() || t('onboarding.registeredHunter')}</Txt>
              <Txt variant="title" style={{ fontSize: 21, marginVertical: 6 }}>
                {t('status.level', { level: 1 })}
              </Txt>
              <StatBar ratio={0.02} height={4} glow={false} />
            </View>
          </View>

          {screening.result === 'blocked' ? (
            <Txt variant="body" tone="red" style={{ marginBottom: 18 }}>{t('onboarding.blockedExplain')}</Txt>
          ) : (
            <>
              <HudLabel tone="muted" style={styles.section}>{t('onboarding.todaysMission')}</HudLabel>
              {preview?.objectives.map((o) => {
                const ex = exerciseById(o.exerciseId);
                return (
                  <View key={o.exerciseId} style={styles.todayRow}>
                    <Txt variant="stat" tone="blue" style={styles.todayValue}>{o.targetValue}</Txt>
                    <Txt variant="body" style={{ flex: 1 }}>
                      {unit(o.unit) ? `${unit(o.unit)} · ` : ''}{ex ? exerciseName(ex, locale) : o.exerciseId}
                    </Txt>
                  </View>
                );
              })}
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.goalHeader}>
            <IconStar c={color.redText} />
            <HudLabel tone="red">{t('onboarding.finalGoal')}</HudLabel>
          </View>
          <View style={styles.goalGrid}>
            {GOAL.map((g) => (
              <View key={g.key} style={styles.goalCard}>
                <Txt variant="stat" tone="red" style={{ fontSize: 21 }}>{g.value}</Txt>
                <Txt variant="bodySm" tone="dim">{t(`onboarding.${g.key}` as TKey)}</Txt>
              </View>
            ))}
          </View>

          <View style={styles.eta}>
            <Txt variant="bodySm" tone="dim">{t('onboarding.estimatedTime')}</Txt>
            <Txt variant="bodyStrong" style={{ fontFamily: 'ChakraPetch_600SemiBold', fontSize: 17 }}>
              {weeksToRankS(rank)} {t('common.weeks')}
            </Txt>
          </View>
          <Txt variant="bodySm" tone="muted" style={{ marginTop: 8 }}>{t('onboarding.canonicalLocked')}</Txt>
        </SystemWindow>

        <View style={styles.actions}>
          <SystemButton label={saving ? '…' : t('onboarding.acceptContract')} icon={<IconArrow />}
            height={58} onPress={accept} disabled={saving} />
          <Txt variant="bodySm" tone="muted" style={styles.note}>{t('onboarding.contractNote')}</Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 28, gap: 22 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 6, height: 6, backgroundColor: color.blue, shadowColor: color.blue, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  section: { marginBottom: 12 },
  todayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 13,
    backgroundColor: color.purpleDim, borderLeftWidth: 2, borderLeftColor: color.blue, marginBottom: 9,
  },
  todayValue: { minWidth: 34, fontSize: 19 },
  divider: { height: 1, backgroundColor: color.line, marginVertical: 18 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalCard: { width: '47.5%', padding: 10, backgroundColor: 'rgba(255,59,92,0.07)', borderWidth: 1, borderColor: 'rgba(255,59,92,0.25)' },
  eta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 13, marginTop: 18, backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
  actions: { gap: space.md },
  note: { textAlign: 'center', fontSize: 11, lineHeight: 17 },
});
