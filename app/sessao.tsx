import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Choice, HudLabel, RepCounter, Screen, SystemButton, SystemWindow, Txt, TOUCH_MIN, color, font, space,
} from '../src/ui';
import { useHunter } from '../src/features/hunter/store';
import { useLocale, useT } from '../src/features/settings/store';
import { useBilling } from '../src/features/billing/store';
import { exerciseById, exerciseCues, exerciseErrors, exerciseName, systemName } from '../src/data/exercises';
import { PROGRAMS } from '../src/data/programs';
import type { RpeBand } from '../src/core/types';
import { REQUIRE_ILLUSTRATIONS } from '../src/core/config';

const BANDS: { band: RpeBand; range: string; key: 'rpeLight' | 'rpeModerate' | 'rpeHard' | 'rpeMax' }[] = [
  { band: 3, range: '3–4', key: 'rpeLight' },
  { band: 5, range: '5–6', key: 'rpeModerate' },
  { band: 7, range: '7–8', key: 'rpeHard' },
  { band: 9, range: '9–10', key: 'rpeMax' },
];

export default function Sessao() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const h = useHunter();
  const quest = h.quest;
  const objective = quest?.objectives.find((o) => o.exerciseId === id) ?? quest?.objectives[0];
  const exercise = objective ? exerciseById(objective.exerciseId) : undefined;

  const [rpe, setRpe] = useState<RpeBand>(5);
  const [formOk, setFormOk] = useState(true);
  const [jointPain, setJointPain] = useState(false);
  const [running, setRunning] = useState(false);
  // Descanso também pelo relógio de parede: bloquear o celular no descanso é o normal.
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - nowTick) / 1000)) : 0;
  const [notice, setNotice] = useState<string | null>(null);
  const lastSetRef = useRef(0);

  const canTrain = useBilling((s) => s.entitlement?.canTrain ?? true);
  useEffect(() => {
    // Defesa em profundidade: a Missão já bloqueia, mas um link direto não pode furar.
    if (!canTrain) { router.replace('/paywall'); return; }
    h.startSession();
  }, [canTrain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enquanto esta tela está aberta, a virada de dia espera: treinar às 23:58
  // não pode ter a missão trocada no meio. Ao fechar, confere se o dia virou.
  useEffect(() => {
    useHunter.getState().setSessionActive(true);
    return () => {
      useHunter.getState().setSessionActive(false);
      void useHunter.getState().refreshDay();
    };
  }, []);

  const program = PROGRAMS[quest?.rank ?? 'E'];
  const sets = program.sets;
  const setSize = objective ? Math.max(1, Math.ceil(objective.targetValue / sets)) : 1;
  const currentSet = objective ? Math.min(sets, Math.floor(objective.actualValue / setSize) + 1) : 1;
  const timed = objective?.unit === 'seconds' || objective?.unit === 'minutes';

  // Cronômetro para exercícios por tempo: tocar na tela 45 vezes numa prancha
  // não faz sentido. Conta pelo RELÓGIO DE PAREDE, não somando ticks: com a
  // tela bloqueada no meio de uma caminhada o JavaScript para, e somar ticks
  // perdia esses minutos. Retomar continua do que já estava gravado.
  const baseSecondsRef = useRef(0);
  const runStartRef = useRef<number | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const toSeconds = (v: number) => (objective?.unit === 'minutes' ? v * 60 : v);
  const elapsedSeconds = () =>
    baseSecondsRef.current + (runStartRef.current ? Math.floor((Date.now() - runStartRef.current) / 1000) : 0);

  // Exercício novo (ou trocado): parte do que já foi gravado nele.
  useEffect(() => {
    runStartRef.current = null;
    baseSecondsRef.current = objective ? toSeconds(objective.actualValue) : 0;
    setLiveSeconds(baseSecondsRef.current);
    setRunning(false);
    // Séries já feitas antes de reabrir não disparam um descanso falso.
    lastSetRef.current = objective ? Math.floor(objective.actualValue / setSize) : 0;
    setRestEndsAt(null);
  }, [objective?.exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Grava o tempo corrido até agora. Chamado a cada tick, ao pausar e ao sair. */
  const flushTimer = () => {
    if (!objective) return;
    const secs = elapsedSeconds();
    setLiveSeconds(secs);
    const value = objective.unit === 'minutes' ? Math.floor(secs / 60) : secs;
    const base = useHunter.getState().quest?.objectives.find((o) => o.exerciseId === objective.exerciseId);
    if (base && value > base.actualValue) h.recordValue(objective.exerciseId, value);
  };

  useEffect(() => {
    if (!running || !objective) return;
    runStartRef.current = Date.now();
    const tick = setInterval(flushTimer, 500);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') flushTimer(); });
    return () => {
      clearInterval(tick);
      sub.remove();
      flushTimer();
      baseSecondsRef.current = elapsedSeconds();
      runStartRef.current = null;
    };
  }, [running, objective?.exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // R5.6 — descanso automático ao fechar uma série.
  useEffect(() => {
    if (!objective || timed) return;
    const finishedSets = Math.floor(objective.actualValue / setSize);
    if (finishedSets > lastSetRef.current && finishedSets < sets) {
      setRestEndsAt(Date.now() + program.restSeconds * 1000);
      setNowTick(Date.now());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    lastSetRef.current = finishedSets;
  }, [objective?.actualValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!restEndsAt) return;
    const tick = setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      if (now >= restEndsAt) setRestEndsAt(null);
    }, 250);
    return () => clearInterval(tick);
  }, [restEndsAt]);

  if (!quest || !objective || !exercise) {
    return <Screen><View style={styles.empty}><Txt tone="dim">{t('quest.noObjective')}</Txt></View></Screen>;
  }

  const unitLabel = objective.unit === 'seconds' ? t('common.seconds')
    : objective.unit === 'minutes' ? t('common.minutes')
      : objective.unit === 'meters' ? t('common.meters') : t('common.reps');
  const done = objective.actualValue >= objective.targetValue;
  const started = objective.actualValue > 0;

  const adjust = async (direction: 'easier' | 'harder') => {
    const next = await h.adjust(objective.exerciseId, direction);
    if (!next) {
      setNotice(direction === 'easier' ? t('quest.noEasier') : t('quest.noHarder'));
      return;
    }
    const ex = exerciseById(next);
    setNotice(t('quest.swapped', { name: ex ? exerciseName(ex, locale) : next }));
    lastSetRef.current = 0;
    router.setParams({ id: next });
  };

  const finish = async () => {
    flushTimer();
    setRunning(false);
    if (jointPain) {
      await h.logPain({ date: h.today, pattern: exercise.pattern, kind: 'joint' });
    }
    await h.finishObjective(objective.exerciseId, rpe, formOk && !jointPain);
    const q = useHunter.getState().quest!;
    // Próximo = o primeiro ainda não ENCERRADO. Usar "abaixo do alvo" prendia
    // o usuário no exercício que ele acabou de encerrar parcial.
    const next = q.objectives.find((o) => !o.completedAt && o.exerciseId !== objective.exerciseId);
    if (!next) {
      const c = await h.completeToday();
      router.replace(c ? '/levelup' : '/missao');
      return;
    }
    router.replace({ pathname: '/sessao', params: { id: next.exerciseId } });
  };

  return (
    <Screen tone="ritual">
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('quest.exitSet')}
            onPress={() => { flushTimer(); setRunning(false); router.back(); }} style={styles.close}>
            <Txt tone="dim" style={{ fontSize: 24 }}>×</Txt>
          </Pressable>
          {!timed && <HudLabel tone="muted" style={{ fontSize: 11 }}>{t('quest.set', { current: currentSet, total: sets })}</HudLabel>}
          <View style={styles.close} />
        </View>

        <HudLabel tone="blue" style={styles.systemName}>{systemName(exercise, locale)}</HudLabel>
        <Txt variant="title" style={styles.name} accessibilityRole="header">{exerciseName(exercise, locale)}</Txt>

        {/* R11.3 — o par de ilustrações é deliverable de arte. Até lá, placeholder honesto. */}
        {/* Build de teste: sem ilustrações, os pontos de técnica abaixo guiam a execução. */}
        {REQUIRE_ILLUSTRATIONS && (
          <View style={styles.illustration}>
            <Txt variant="bodySm" tone="muted">{t('quest.illustrationPending')}</Txt>
          </View>
        )}

        <View style={styles.cues}>
          {exerciseCues(exercise, locale).map((c, i) => (
            <View key={c} style={styles.cueRow}>
              <Txt variant="bodySm" tone="blue" style={styles.cueNum}>{i + 1}</Txt>
              <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>{c}</Txt>
            </View>
          ))}
        </View>

        {restLeft > 0 ? (
          <SystemWindow variant="highlight" padding={20}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <HudLabel tone="blue">{t('quest.rest')}</HudLabel>
              <Txt variant="statLg" style={{ fontSize: 56 }} accessibilityLiveRegion="polite">
                {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}
              </Txt>
              <SystemButton label={t('quest.skipRest')} variant="ghost" height={44}
                onPress={() => setRestEndsAt(null)} style={{ alignSelf: 'stretch' }} />
            </View>
          </SystemWindow>
        ) : timed ? (
          <SystemWindow variant="highlight" padding={20}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Txt variant="statLg" style={{ fontSize: 72, fontVariant: ['tabular-nums'] }} accessibilityLiveRegion="polite">
                {objective.unit === 'minutes'
                  ? `${Math.floor(Math.max(liveSeconds, objective.actualValue * 60) / 60)}:${String(Math.max(liveSeconds, objective.actualValue * 60) % 60).padStart(2, '0')}`
                  : Math.max(liveSeconds, objective.actualValue)}
              </Txt>
              <Txt variant="body" tone="muted">{t('common.of')} {objective.targetValue} {unitLabel}</Txt>
              <View style={styles.timerRow}>
                <SystemButton label={running ? t('quest.pause') : t('quest.startTimer')}
                  onPress={() => setRunning((r) => !r)} style={{ flex: 1 }} />
                <SystemButton label="+1" variant="ghost" style={{ width: 72 }}
                  onPress={() => h.recordValue(objective.exerciseId, objective.actualValue + 1)} />
                <SystemButton label="+5" variant="ghost" style={{ width: 72 }}
                  onPress={() => h.recordValue(objective.exerciseId, objective.actualValue + 5)} />
              </View>
            </View>
          </SystemWindow>
        ) : (
          <RepCounter
            value={objective.actualValue}
            target={objective.targetValue}
            unit={unitLabel}
            hint={t('quest.tapEachRep')}
            ofLabel={t('common.of')}
            accessibilityPrefix={t('quest.recordRep')}
            onIncrement={() => h.recordValue(objective.exerciseId, objective.actualValue + 1)}
          />
        )}

        {notice && <Txt variant="bodySm" tone="blue" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">{notice}</Txt>}

        {/* R5.7–R5.9 — sempre visíveis, sem confirmação, sem julgamento. */}
        <View style={styles.escapeRow}>
          <Pressable accessibilityRole="button" onPress={() => adjust('easier')} style={[styles.escape, styles.escapeHard]}>
            <Txt variant="bodySm" tone="red" style={styles.escapeText}>{t('quest.tooHard')}</Txt>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => adjust('harder')} style={[styles.escape, styles.escapeEasy]}>
            <Txt variant="bodySm" tone="blue" style={styles.escapeText}>{t('quest.tooEasy')}</Txt>
          </Pressable>
        </View>
        <Txt variant="bodySm" tone="muted" style={styles.center}>{t('quest.noJudgement')}</Txt>

        {started && (
          <View style={{ gap: space.md }}>
            <View style={styles.rpeHead}>
              <HudLabel tone="muted" style={{ fontSize: 11 }}>{t('quest.perceivedEffort')}</HudLabel>
              <Txt variant="bodySm" tone="blue">{t('quest.talkTest')}</Txt>
            </View>
            <Choice<RpeBand> value={rpe} onChange={setRpe}
              options={BANDS.map((b) => ({ value: b.band, label: `${b.range}\n${t(`quest.${b.key}`)}` }))} />

            <Txt variant="bodySm">{t('quest.formQuestion')}</Txt>
            <Choice value={formOk ? 'yes' : 'no'} onChange={(v) => setFormOk(v === 'yes')}
              options={[{ value: 'yes', label: t('common.yes') }, { value: 'no', label: t('common.no') }]} />

            <Txt variant="bodySm">{t('quest.painQuestion')}</Txt>
            <Choice value={jointPain ? 'yes' : 'no'} onChange={(v) => setJointPain(v === 'yes')}
              tone={jointPain ? 'red' : 'purple'}
              options={[{ value: 'yes', label: t('common.yes') }, { value: 'no', label: t('common.no') }]} />
            {jointPain && <Txt variant="bodySm" tone="red">{t('quest.painNote')}</Txt>}
          </View>
        )}

        {done ? (
          <SystemButton label={t('quest.finishSet')} onPress={finish} />
        ) : (
          <>
            <SystemButton label={t('quest.markDone')} variant="ghost"
              onPress={() => { setRunning(false); h.recordValue(objective.exerciseId, objective.targetValue); }} />
            {/* Não conseguiu terminar: registra o que fez e segue. O parcial conta (R5.11). */}
            {started && <SystemButton label={t('quest.finishPartial')} variant="ghost" onPress={finish} />}
          </>
        )}

        <View style={styles.errors}>
          <HudLabel tone="muted" style={{ fontSize: 10, marginBottom: 6 }}>{t('codex.commonErrors')}</HudLabel>
          {exerciseErrors(exercise, locale).map((e) => (
            <Txt key={e} variant="bodySm" tone="muted">· {e}</Txt>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: space.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  systemName: { textAlign: 'center', fontSize: 11, marginTop: 4 },
  name: { textAlign: 'center', fontSize: 23, marginTop: -6 },
  illustration: {
    height: 88, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.purpleBorder, borderStyle: 'dashed',
  },
  cues: { gap: 6 },
  cueRow: { flexDirection: 'row', gap: 9 },
  cueNum: { width: 14, fontFamily: font.displayMedium },
  timerRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  rpeHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  escapeRow: { flexDirection: 'row', gap: 9 },
  escape: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  escapeHard: { backgroundColor: color.redDim, borderColor: 'rgba(255,59,92,0.38)' },
  escapeEasy: { backgroundColor: color.blueDim, borderColor: color.blueBorder },
  escapeText: { fontFamily: font.displayMedium, fontSize: 12.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  center: { textAlign: 'center', fontSize: 11.5 },
  errors: { padding: 12, backgroundColor: color.surfaceAlt, borderLeftWidth: 2, borderLeftColor: color.purpleBorder },
});
