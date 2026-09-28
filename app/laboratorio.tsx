import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Choice, Header, HudLabel, IconInfo, Note, Row, Screen, Section, SystemButton, SystemWindow, Txt,
  color, space,
} from '../src/ui';
import { useHunter } from '../src/features/hunter/store';
import { useLocale, useT } from '../src/features/settings/store';
import { getDayOffset } from '../src/core/clock';
import { projectTrainingDays } from '../src/core/engine';
import { formatDate, type TKey } from '../src/core/i18n';
import { repositories } from '../src/core/repositories';
import { EXERCISES, exerciseById, exerciseName } from '../src/data/exercises';
import { SHADOW_RULES } from '../src/data/shadowRules';
import type { DailyQuest, PainLogEntry, Unit } from '../src/core/types';

const UNIT: Record<Unit, string> = { reps: '', seconds: 's', minutes: ' min', meters: ' m' };

type Tab = 'history' | 'plan';

/**
 * Laboratório — só existe no build de teste pessoal.
 *
 * Três coisas: o histórico do que foi GRAVADO (missão a missão, alvo × feito),
 * a projeção dos próximos treinos se tudo for cumprido, e o relógio do app
 * para viver semanas em minutos.
 */
export default function Laboratorio() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const h = useHunter();
  const [tab, setTab] = useState<Tab>('history');
  const [history, setHistory] = useState<DailyQuest[]>([]);
  const [pain, setPain] = useState<PainLogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  // Recarrega quando o log muda (missão concluída, dia avançado).
  useEffect(() => {
    if (!h.startedAt) return;
    void repositories.quests.between(h.startedAt, h.today).then((qs) =>
      setHistory([...qs].sort((a, b) => (a.date < b.date ? 1 : -1))));
    void repositories.pain.all().then(setPain);
  }, [h.startedAt, h.today, h.events.length, h.quest?.status]);

  const plan = useMemo(() => {
    if (tab !== 'plan' || !h.profile || !h.screening || !h.startedAt) return [];
    return projectTrainingDays({
      profile: h.profile, events: h.events, quests: history, pain, screening: h.screening,
      catalog: EXERCISES, rules: SHADOW_RULES, startedAt: h.startedAt, today: h.today,
      todayQuest: h.quest, count: 9,
    });
  }, [tab, h.profile, h.screening, h.startedAt, h.today, h.events, h.quest, history, pain]);

  if (!h.profile) return <Screen><View /></Screen>;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const skipWeek = () => Alert.alert(t('lab.skipWeekTitle'), t('lab.skipWeekBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.confirm'), onPress: () => void run(() => h.advanceDays(7)) },
  ]);

  const offset = getDayOffset();
  const todayDone = h.quest?.status === 'completed';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title={t('lab.title')} onBack={() => router.back()} backLabel={t('common.back')} />

        <Note icon={<IconInfo />}>
          <Txt variant="bodySm" tone="dim">{t('lab.intro')}</Txt>
        </Note>

        <Section label={t('lab.clock')}>
          <Row label={t('lab.appDate')} value={formatDate(h.today, locale)} />
          <Row label={t('lab.offset')} value={offset ? t('lab.daysAhead', { days: offset }) : t('lab.realToday')} />
          <Row label={t('lab.todayQuest')}
            value={h.quest?.isRestDay ? t('lab.rest') : todayDone ? t('lab.done') : t('lab.pending')} />
          <SystemButton label={t('lab.autoComplete')} height={48} disabled={busy || !h.quest || todayDone}
            onPress={() => void run(() => h.autoCompleteToday())} />
          <SystemButton label={t('lab.nextDay')} variant="blue" height={48} disabled={busy}
            onPress={() => void run(() => h.advanceDays(1))} />
          <SystemButton label={t('lab.skipWeek')} variant="ghost" height={46} disabled={busy} onPress={skipWeek} />
          <Txt variant="bodySm" tone="muted">{t('lab.clockNote')}</Txt>
        </Section>

        <Choice<Tab> value={tab} onChange={setTab} options={[
          { value: 'history', label: t('lab.history') },
          { value: 'plan', label: t('lab.plan') },
        ]} />

        {tab === 'history' && (
          history.length === 0
            ? <Txt variant="bodySm" tone="muted">{t('lab.historyEmpty')}</Txt>
            : history.map((q) => renderCard(q, 'history'))
        )}

        {tab === 'plan' && (
          <>
            <Txt variant="bodySm" tone="muted">{t('lab.planNote')}</Txt>
            {plan.map((q, i) => renderCard(q, 'plan', plan[i - 1] ?? h.quest))}
          </>
        )}
      </ScrollView>
    </Screen>
  );

  // Função de render, não componente: um componente declarado aqui dentro
  // seria um tipo novo a cada render e remontaria a lista inteira.
  function renderCard(quest: DailyQuest, mode: Tab, previous?: DailyQuest | null) {
    const missed = mode === 'history' && quest.date < h.today && quest.status === 'pending';
    const status = quest.isRestDay ? t('lab.rest')
      : quest.status === 'completed' ? t('lab.done')
        : quest.status === 'partial' ? t('lab.partial')
          : missed ? t('lab.missed') : t('lab.pending');
    const prevByPattern = new Map(
      (previous?.objectives ?? []).map((o) => [exerciseById(o.exerciseId)?.pattern, o]));

    return (
      <SystemWindow key={`${mode}:${quest.date}`} padding={14} variant={missed ? 'alert' : 'default'}>
        <View style={styles.cardHead}>
          <HudLabel tone={mode === 'plan' ? 'blue' : 'muted'} style={{ fontSize: 11 }}>
            {formatDate(quest.date, locale)} · {t(`ranks.${quest.rank ?? 'E'}` as TKey)}
          </HudLabel>
          <Txt variant="bodySm" tone={missed ? 'red' : quest.status === 'completed' ? 'green' : 'muted'}>
            {mode === 'plan' ? (quest.isDeload ? t('lab.deload') : '') : status}
          </Txt>
        </View>
        {quest.objectives.map((o) => {
          const ex = exerciseById(o.exerciseId);
          const prev = ex ? prevByPattern.get(ex.pattern) : undefined;
          const newRung = mode === 'plan' && prev && prev.exerciseId !== o.exerciseId;
          const up = mode === 'plan' && prev && prev.exerciseId === o.exerciseId && o.targetValue > prev.targetValue;
          return (
            <View key={o.exerciseId} style={styles.line}>
              <Txt variant="bodySm" style={{ flex: 1 }} numberOfLines={1}>
                {ex ? exerciseName(ex, locale) : o.exerciseId}
                {newRung ? <Txt variant="bodySm" tone="blue">  ↑ {t('lab.newRung')}</Txt> : null}
              </Txt>
              <Txt variant="bodySm" tone={up ? 'blue' : 'dim'}>
                {mode === 'history' ? `${o.actualValue}/` : ''}{o.targetValue}{UNIT[o.unit]}
                {mode === 'history' && o.formOk === false ? ` · ${t('lab.badForm')}` : ''}
              </Txt>
            </View>
          );
        })}
        {mode === 'history' && quest.xpAwarded ? (
          <Txt variant="bodySm" tone="muted" style={{ marginTop: 4 }}>+{quest.xpAwarded} XP</Txt>
        ) : null}
      </SystemWindow>
    );
  }
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: space.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  line: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line,
  },
});
