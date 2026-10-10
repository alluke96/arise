import { create } from 'zustand';
import {
  adjustObjective, addDays, buildQuestInput, completeQuest, computeStats, creditedDuration, evaluateBenchmark,
  evaluateShadows, eventId, foldLadder, generateDailyQuest, isQuestComplete, isScreeningExpired,
  makeSchedule, reconcile, unlockedFromEvents,
  type BenchmarkAttempt, type BenchmarkOutcome, type Completion, type LadderPosition,
} from '../../core/engine';
import { getDeviceId, newId } from '../../core/ids';
import { getDayOffset, nowISO, setDayOffset } from '../../core/clock';
import { DEMO_MODE, repositories } from '../../core/repositories';
import type { DomainEvent } from '../../core/sync/events';
import { foldAll, INITIAL_PROGRESSION } from '../../core/sync/fold';
import type { StreakSnapshot } from '../../core/engine/penalty';
import type {
  Attribute, DailyQuest, HealthScreening, Pattern, PainLogEntry, Progression, RpeBand, UserProfile,
} from '../../core/types';
import { EXERCISES } from '../../data/exercises';
import { todayISO, withPartialProgress } from '../../data/mocks/demo';
import { SHADOW_RULES } from '../../data/shadowRules';

/** Reavaliação sob demanda no máximo a cada 3 semanas (R7.4). */
export const BENCHMARK_COOLDOWN_DAYS = 21;

interface HunterState {
  ready: boolean;
  today: string;
  profile: UserProfile | null;
  screening: HealthScreening | null;
  screeningExpired: boolean;
  startedAt: string | null;
  events: DomainEvent[];
  progression: Progression;
  streak: StreakSnapshot | null;
  ladder: Partial<Record<Pattern, LadderPosition>>;
  shadowProgress: Record<string, number>;
  unlockedShadows: string[];
  /** Dias da semana de treino em vigor hoje (0 = domingo). */
  trainingDays: number[];
  quest: DailyQuest | null;
  penaltyOpenFor: string | null;
  /** Dungeon Break detectado nesta abertura — mostrado uma vez. */
  dungeonBreak: boolean;
  lastCompletion: Completion | null;
  sessionStartedAt: number | null;
  /** A tela de sessão está aberta: a virada de dia espera ela fechar. */
  sessionActive: boolean;
  lastBenchmarkOn: string | null;

  /** `regenerateIfUntouched`: refaz a missão de hoje se ela ainda não foi começada. */
  boot(opts?: { regenerateIfUntouched?: boolean }): Promise<void>;
  startSession(): void;
  setSessionActive(active: boolean): void;
  /**
   * Troca os dias de treino. Vale de HOJE em diante — os dias passados seguem
   * julgados pela agenda antiga (sem penalidade retroativa). Se a missão de
   * hoje ainda não foi começada, ela é refeita com a agenda nova.
   */
  setTrainingDays(weekdays: number[]): Promise<void>;
  /** Distribui 1 ponto de atributo (os pontos vêm a cada nível). */
  spendPoint(attribute: Attribute): Promise<void>;
  /** Exercício aberto no Códice conta como estudo (INT, sombra Arauto). Idempotente. */
  markCodexRead(exerciseId: string): Promise<void>;
  /**
   * Chamado quando o app volta ao primeiro plano e à meia-noite. Se o dia
   * mudou, reabre (reconcilia penalidades, gera a missão nova). Devolve se
   * reabriu. Nunca troca o dia no meio de uma sessão aberta.
   */
  refreshDay(): Promise<boolean>;
  recordValue(exerciseId: string, value: number): void;
  finishObjective(exerciseId: string, rpe: RpeBand, formOk: boolean): Promise<void>;
  /** Troca o exercício na hora. Devolve o id novo, ou null se não há degrau. */
  adjust(exerciseId: string, direction: 'easier' | 'harder'): Promise<string | null>;
  completeToday(): Promise<Completion | null>;
  clearPenalty(): Promise<void>;
  useStone(): Promise<boolean>;
  dismissDungeonBreak(): void;
  submitBenchmark(attempt: BenchmarkAttempt): Promise<BenchmarkOutcome>;
  logPain(entry: PainLogEntry): Promise<void>;
  setInjured(injured: boolean): Promise<void>;
  saveProfile(patch: Partial<UserProfile>): Promise<void>;
  wipe(): Promise<void>;
  /** Build de teste: marca tudo de hoje como feito, com boa forma, e conclui. */
  autoCompleteToday(): Promise<Completion | null>;
  /** Build de teste: adianta o relógio do app e reabre o dia. */
  advanceDays(days: number): Promise<void>;
}

/** Chaves do estado do app que "apagar tudo" preserva. */
const PRESERVED_KEYS = ['device_id', 'admin_session'];

/** Deslocamento do relógio do build de teste, persistido entre aberturas. */
export const CLOCK_KEY = 'test_clock_offset_days';

export async function loadClockOffset(): Promise<void> {
  const raw = await repositories.app.getValue(CLOCK_KEY);
  setDayOffset(raw ? Number(raw) || 0 : 0);
}

const localHour = () => new Date().getHours();

export const useHunter = create<HunterState>((set, get) => {
  /** Tudo que é derivado do log, recalculado de uma vez. */
  function derive(events: DomainEvent[], profile: UserProfile, startedAt: string, today: string) {
    const folded = foldAll(events);
    const stats = computeStats(events, {
      startedAt, today, daysPerWeek: profile.daysPerWeek,
      catalog: EXERCISES, streakBest: folded.progression.streakBest,
    });
    const unlocked = unlockedFromEvents(events);
    const lastBench = [...events].reverse().find((e) => e.kind === 'benchmark_passed' && e.id !== 'placement');
    return {
      events,
      trainingDays: [...makeSchedule(events, profile.daysPerWeek)(today)],
      progression: folded.progression,
      streak: folded.streak,
      ladder: foldLadder(events, EXERCISES, profile),
      shadowProgress: evaluateShadows(SHADOW_RULES, stats, unlocked).progress,
      unlockedShadows: [...unlocked],
      lastBenchmarkOn: lastBench ? lastBench.at.slice(0, 10) : null,
    };
  }

  async function append(newEvents: DomainEvent[]): Promise<void> {
    for (const e of newEvents) await repositories.events.append(e);
    const { profile, startedAt, today } = get();
    if (!profile || !startedAt) return;
    set(derive(await repositories.events.all(), profile, startedAt, today));
  }

  /**
   * Horário para um evento novo: agora, mas nunca antes do último evento do
   * log. A sessão do dia é gravada às 12:00 UTC da data da missão; sem isto,
   * um ponto gasto às 8h, depois de treinar às 7h, entraria no log ANTES da
   * sessão que deu o ponto — e o fold o descartaria em silêncio.
   */
  function monotonicAt(): string {
    const now = nowISO();
    const last = get().events.at(-1)?.at;
    if (!last || now > last) return now;
    return new Date(Date.parse(last) + 1).toISOString();
  }

  async function saveQuest(quest: DailyQuest): Promise<void> {
    set({ quest });
    await repositories.quests.save(quest);
  }

  return {
    ready: false,
    today: todayISO(),
    profile: null,
    screening: null,
    screeningExpired: false,
    startedAt: null,
    events: [],
    progression: INITIAL_PROGRESSION,
    streak: null,
    ladder: {},
    shadowProgress: {},
    unlockedShadows: [],
    trainingDays: [],
    quest: null,
    penaltyOpenFor: null,
    dungeonBreak: false,
    lastCompletion: null,
    sessionStartedAt: null,
    sessionActive: false,
    lastBenchmarkOn: null,

    /**
     * Abertura do app: reconcilia o calendário com o log (pedras do mês,
     * penalidades vencidas, Dungeon Break) e gera a missão de hoje com os
     * dados reais do usuário.
     */
    async boot(opts) {
      const today = todayISO();
      const profile = await repositories.profile.get();
      if (!profile || !(await repositories.profile.isOnboarded())) {
        set({ ready: true, today, profile });
        return;
      }
      const startedAt = (await repositories.profile.startedAt()) ?? today;
      const screening = await repositories.screening.getLatest();

      let events = await repositories.events.all();
      const rec = reconcile({
        events, today, daysPerWeek: profile.daysPerWeek, startedAt, deviceId: getDeviceId(),
      });
      for (const e of rec.toAppend) await repositories.events.append(e);
      if (rec.toAppend.length) events = await repositories.events.all();

      let quest = await repositories.quests.forDate(today);
      const untouched = quest !== null && quest.status === 'pending'
        && quest.objectives.every((o) => o.actualValue === 0);
      if ((!quest || (opts?.regenerateIfUntouched && untouched)) && screening) {
        const input = buildQuestInput({
          profile, events, screening, catalog: EXERCISES, startedAt, today,
          quests: await repositories.quests.between(addDays(today, -28), addDays(today, -1)),
          pain: await repositories.pain.all(),
        });
        quest = generateDailyQuest(input);
        if (DEMO_MODE) quest = withPartialProgress(quest);
        await repositories.quests.save(quest);
      }

      // Virou o dia: o cronômetro de uma sessão de ontem não vale para hoje.
      const dayChanged = get().today !== today;
      set({
        ready: true, today, profile, screening, startedAt, quest,
        ...(dayChanged ? { sessionStartedAt: null } : {}),
        screeningExpired: screening ? isScreeningExpired(screening, today) : true,
        penaltyOpenFor: rec.penaltyOpenFor,
        dungeonBreak: rec.dungeonBreak,
        ...derive(events, profile, startedAt, today),
      });
    },

    setSessionActive(active) { set({ sessionActive: active }); },

    async setTrainingDays(weekdays) {
      const { profile, today, events } = get();
      if (!profile) return;
      const days = [...new Set(weekdays)].sort((a, b) => a - b);
      // Data LOCAL de hoje no evento (meio-dia UTC cai no mesmo dia em todo o
      // Brasil): às 21h, "agora" em UTC já é amanhã e a troca valeria só lá.
      const sameDay = events
        .filter((e) => e.kind === 'schedule_changed' && e.at.slice(0, 10) === today)
        .map((e) => e.at).sort().at(-1);
      const at = sameDay ? new Date(Date.parse(sameDay) + 1).toISOString() : `${today}T12:00:00.000Z`;
      await append([{ id: `schedule:${newId()}`, at, deviceId: getDeviceId(), kind: 'schedule_changed', weekdays: days }]);
      await get().saveProfile({ daysPerWeek: days.length as UserProfile['daysPerWeek'] });
      await get().boot({ regenerateIfUntouched: true });
    },

    async spendPoint(attribute) {
      if (get().progression.unspentPoints <= 0) return;
      await append([{
        id: `points:${newId()}`, at: monotonicAt(), deviceId: getDeviceId(),
        kind: 'points_spent', attribute, amount: 1,
      }]);
    },

    async markCodexRead(exerciseId) {
      const id = `codex:${exerciseId}`;
      if (!get().profile || get().events.some((e) => e.id === id)) return;
      await append([{ id, at: monotonicAt(), deviceId: getDeviceId(), kind: 'codex_read', exerciseId }]);
    },

    async refreshDay() {
      const { today, sessionActive, ready } = get();
      if (!ready || sessionActive || todayISO() === today) return false;
      await get().boot();
      return true;
    },

    startSession() {
      if (!get().sessionStartedAt) set({ sessionStartedAt: Date.now() });
    },

    recordValue(exerciseId, value) {
      const q = get().quest;
      if (!q) return;
      void saveQuest({
        ...q,
        status: q.status === 'pending' ? 'partial' : q.status,
        objectives: q.objectives.map((o) =>
          o.exerciseId === exerciseId ? { ...o, actualValue: Math.max(0, Math.min(value, o.targetValue)) } : o),
      });
    },

    async finishObjective(exerciseId, rpe, formOk) {
      const q = get().quest;
      if (!q) return;
      await saveQuest({
        ...q,
        objectives: q.objectives.map((o) =>
          o.exerciseId === exerciseId
            ? { ...o, rpe, formOk, completedAt: nowISO() }
            : o),
      });
    },

    async adjust(exerciseId, direction) {
      const { quest, profile, progression } = get();
      if (!quest || !profile) return null;
      const a = adjustObjective({
        quest, exerciseId, direction, catalog: EXERCISES, profile,
        rank: quest.rank ?? progression.rank, deviceId: getDeviceId(), at: monotonicAt(),
      });
      if (!a) return null;
      await saveQuest(a.quest);
      await append([a.event]);
      return a.toExercise.id;
    },

    /** Conclui o dia, mesmo parcial (R5.11): o que foi feito conta. */
    async completeToday() {
      const { quest, events, profile, startedAt, today, sessionStartedAt } = get();
      if (!quest || !profile || !startedAt) return null;
      // Tempo de relógio desde a abertura da sessão, com teto: é ele que vira XP.
      const durationMin = creditedDuration(
        sessionStartedAt ? (Date.now() - sessionStartedAt) / 60_000 : profile.sessionMinutes,
        profile.sessionMinutes,
      );

      const completion = completeQuest({
        quest, catalog: EXERCISES, events, deviceId: getDeviceId(), durationMin,
        localHour: localHour(), rules: SHADOW_RULES,
        stats: { startedAt, today, daysPerWeek: profile.daysPerWeek },
      });

      await saveQuest({
        ...quest,
        status: isQuestComplete(quest) || quest.isRestDay ? 'completed' : 'partial',
        xpAwarded: completion.xpGained,
      });
      await append(completion.events);
      set({ lastCompletion: completion, sessionStartedAt: null });
      return completion;
    },

    async clearPenalty() {
      const day = get().penaltyOpenFor;
      if (!day) return;
      await append([{
        id: eventId.penaltyDone(day), at: monotonicAt(),
        deviceId: getDeviceId(), kind: 'penalty_completed',
      }]);
      set({ penaltyOpenFor: null });
    },

    async useStone() {
      const { penaltyOpenFor: day, progression } = get();
      // Sem pedra, o botão não protege nada — nem de graça.
      if (!day || progression.recoveryStones <= 0) return false;
      await append([{
        id: eventId.stoneUse(day), at: monotonicAt(),
        deviceId: getDeviceId(), kind: 'stone_used',
      }]);
      set({ penaltyOpenFor: null });
      return true;
    },

    dismissDungeonBreak() { set({ dungeonBreak: false }); },

    async submitBenchmark(attempt) {
      const { progression, today } = get();
      const outcome = evaluateBenchmark(progression.rank, attempt);
      if (outcome.passed) {
        await append([{
          id: `bench:${today}`, at: monotonicAt(), deviceId: getDeviceId(),
          kind: 'benchmark_passed', rankAfter: outcome.targetRank,
        }]);
      }
      return outcome;
    },

    async logPain(entry) {
      await repositories.pain.add(entry);
      const { profile, startedAt, today } = get();
      if (profile && startedAt) set(derive(await repositories.events.all(), profile, startedAt, today));
    },

    async setInjured(injured) {
      await append([{
        id: `injury:${injured ? 'on' : 'off'}:${Date.now()}`, at: monotonicAt(),
        deviceId: getDeviceId(), kind: injured ? 'injury_declared' : 'injury_cleared',
      }]);
    },

    async saveProfile(patch) {
      const current = get().profile;
      if (!current) return;
      const profile = { ...current, ...patch };
      await repositories.profile.save(profile);
      set({ profile });
    },

    async autoCompleteToday() {
      const q = get().quest;
      if (!q || q.status === 'completed') return null;
      const at = nowISO();
      await saveQuest({
        ...q,
        status: 'partial',
        objectives: q.objectives.map((o) => ({
          ...o, actualValue: o.targetValue, rpe: 5, formOk: true, completedAt: at,
        })),
      });
      return get().completeToday();
    },

    async advanceDays(days) {
      const next = getDayOffset() + Math.max(0, Math.round(days));
      setDayOffset(next);
      await repositories.app.setValue(CLOCK_KEY, String(next));
      set({ lastCompletion: null, sessionStartedAt: null });
      await get().boot();
    },

    async wipe() {
      // O id do aparelho e a sessão de login não são histórico: sobrevivem.
      const kept = await Promise.all(PRESERVED_KEYS.map((k) => repositories.app.getValue(k)));
      await repositories.app.wipe();
      for (const [i, k] of PRESERVED_KEYS.entries()) {
        const v = kept[i];
        if (v !== null && v !== undefined) await repositories.app.setValue(k, v);
      }
      // Recomeçar do zero também volta o relógio para hoje de verdade:
      // eventos com data "no futuro" não sobram para confundir o calendário.
      setDayOffset(0);
      set({
        today: todayISO(),
        ready: true, profile: null, screening: null, startedAt: null, events: [],
        progression: INITIAL_PROGRESSION, streak: null, quest: null, ladder: {},
        shadowProgress: {}, unlockedShadows: [], trainingDays: [], penaltyOpenFor: null,
        dungeonBreak: false, lastCompletion: null,
      });
    },
  };
});

/** Semanas até a próxima reavaliação liberada. 0 = liberada. */
export function benchmarkCooldown(lastOn: string | null, today: string): number {
  if (!lastOn) return 0;
  const days = Math.round((Date.parse(today) - Date.parse(lastOn)) / 86400_000);
  return Math.max(0, BENCHMARK_COOLDOWN_DAYS - days);
}
