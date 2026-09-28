import { create } from 'zustand';
import {
  adjustObjective, addDays, buildQuestInput, completeQuest, computeStats, evaluateBenchmark,
  evaluateShadows, eventId, foldLadder, generateDailyQuest, isQuestComplete, isScreeningExpired,
  reconcile, unlockedFromEvents,
  type BenchmarkAttempt, type BenchmarkOutcome, type Completion, type LadderPosition,
} from '../../core/engine';
import { getDeviceId } from '../../core/ids';
import { getDayOffset, nowISO, setDayOffset } from '../../core/clock';
import { DEMO_MODE, repositories } from '../../core/repositories';
import type { DomainEvent } from '../../core/sync/events';
import { foldAll, INITIAL_PROGRESSION } from '../../core/sync/fold';
import type { StreakSnapshot } from '../../core/engine/penalty';
import type {
  DailyQuest, HealthScreening, Pattern, PainLogEntry, Progression, RpeBand, UserProfile,
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
  quest: DailyQuest | null;
  penaltyOpenFor: string | null;
  /** Dungeon Break detectado nesta abertura — mostrado uma vez. */
  dungeonBreak: boolean;
  lastCompletion: Completion | null;
  sessionStartedAt: number | null;
  lastBenchmarkOn: string | null;

  boot(): Promise<void>;
  startSession(): void;
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
    quest: null,
    penaltyOpenFor: null,
    dungeonBreak: false,
    lastCompletion: null,
    sessionStartedAt: null,
    lastBenchmarkOn: null,

    /**
     * Abertura do app: reconcilia o calendário com o log (pedras do mês,
     * penalidades vencidas, Dungeon Break) e gera a missão de hoje com os
     * dados reais do usuário.
     */
    async boot() {
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
      if (!quest && screening) {
        const input = buildQuestInput({
          profile, events, screening, catalog: EXERCISES, startedAt, today,
          quests: await repositories.quests.between(addDays(today, -28), addDays(today, -1)),
          pain: await repositories.pain.all(),
        });
        quest = generateDailyQuest(input);
        if (DEMO_MODE) quest = withPartialProgress(quest);
        await repositories.quests.save(quest);
      }

      set({
        ready: true, today, profile, screening, startedAt, quest,
        screeningExpired: screening ? isScreeningExpired(screening, today) : true,
        penaltyOpenFor: rec.penaltyOpenFor,
        dungeonBreak: rec.dungeonBreak,
        ...derive(events, profile, startedAt, today),
      });
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
        rank: quest.rank ?? progression.rank, deviceId: getDeviceId(), at: nowISO(),
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
      const durationMin = sessionStartedAt
        ? (Date.now() - sessionStartedAt) / 60_000
        : profile.sessionMinutes;

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
        id: eventId.penaltyDone(day), at: nowISO(),
        deviceId: getDeviceId(), kind: 'penalty_completed',
      }]);
      set({ penaltyOpenFor: null });
    },

    async useStone() {
      const { penaltyOpenFor: day, progression } = get();
      // Sem pedra, o botão não protege nada — nem de graça.
      if (!day || progression.recoveryStones <= 0) return false;
      await append([{
        id: eventId.stoneUse(day), at: nowISO(),
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
          id: `bench:${today}`, at: nowISO(), deviceId: getDeviceId(),
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
        id: `injury:${injured ? 'on' : 'off'}:${Date.now()}`, at: nowISO(),
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
        shadowProgress: {}, unlockedShadows: [], penaltyOpenFor: null,
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
