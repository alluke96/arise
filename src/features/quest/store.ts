import { create } from 'zustand';
import { generateDailyQuest, isQuestComplete, questProgress } from '../../core/engine';
import { repositories } from '../../core/repositories';
import type { DailyQuest, RpeBand } from '../../core/types';
import {
  DEMO_LAST_WEEK_VOLUME, DEMO_TODAY, DEMO_WEEK_INDEX, applyDemoProgress,
} from '../../data/mocks/demo';

interface QuestState {
  quest: DailyQuest | null;
  loading: boolean;
  load: (date?: string) => Promise<void>;
  recordReps: (exerciseId: string, value: number) => void;
  finishObjective: (exerciseId: string, rpe: RpeBand, formOk: boolean) => void;
  progress: () => number;
  isComplete: () => boolean;
}

export const useQuest = create<QuestState>((set, get) => ({
  quest: null,
  loading: false,

  /**
   * A Missão Diária é GERADA pelo motor sobre os mocks — nunca escrita à mão.
   * Isso exercita `generateDailyQuest` desde o primeiro dia e garante que as
   * telas recebam dados com a forma real.
   */
  async load(date = DEMO_TODAY) {
    set({ loading: true });
    const cached = await repositories.quests.forDate(date);
    if (cached) {
      set({ quest: cached, loading: false });
      return;
    }

    const [profile, progression, screening, catalog, history, painLog] = await Promise.all([
      repositories.profile.get(),
      repositories.progression.get(),
      repositories.screening.getLatest(),
      repositories.exercises.all(),
      repositories.quests.recentSessions(12),
      repositories.pain.all(),
    ]);
    if (!profile || !screening) {
      set({ loading: false });
      return;
    }

    const generated = generateDailyQuest({
      profile, progression, screening, catalog, history, painLog, date,
      weekIndex: DEMO_WEEK_INDEX,
      lastWeekVolume: DEMO_LAST_WEEK_VOLUME,
      sleepHours: 7,
      soreness: 1,
      consecutiveFailures: 0,
      isTrainingDay: true,
    });

    const withProgress = applyDemoProgress(generated);
    await repositories.quests.save(withProgress);
    set({ quest: withProgress, loading: false });
  },

  recordReps(exerciseId, value) {
    const q = get().quest;
    if (!q) return;
    const quest: DailyQuest = {
      ...q,
      objectives: q.objectives.map((o) =>
        o.exerciseId === exerciseId
          ? { ...o, actualValue: Math.min(Math.max(0, value), o.targetValue) }
          : o,
      ),
    };
    set({ quest });
    void repositories.quests.save(quest);
  },

  finishObjective(exerciseId, rpe, formOk) {
    const q = get().quest;
    if (!q) return;
    const quest: DailyQuest = {
      ...q,
      objectives: q.objectives.map((o) =>
        o.exerciseId === exerciseId
          ? { ...o, rpe, formOk, actualValue: o.targetValue, completedAt: new Date().toISOString() }
          : o,
      ),
    };
    quest.status = isQuestComplete(quest) ? 'completed' : 'partial';
    set({ quest });
    void repositories.quests.save(quest);
  },

  progress() {
    const q = get().quest;
    return q ? questProgress(q) : 0;
  },

  isComplete() {
    const q = get().quest;
    return q ? isQuestComplete(q) : false;
  },
}));
