import { EXERCISES, exerciseById } from '../../data/exercises';
import { SHADOWS } from '../../data/shadows';
import {
  DEMO_PAIN_LOG, DEMO_PROFILE, DEMO_PROGRESSION, DEMO_SCREENING, DEMO_SESSIONS,
} from '../../data/mocks/demo';
import type {
  DailyQuest, HealthScreening, PainLogEntry, Progression,
  SessionSummary, Shadow, UserProfile,
} from '../types';
import type { Repositories } from './types';

/** Implementação em memória. Mesma interface que a SQLite vai implementar,
 *  mesmos tipos de domínio — nenhuma forma inventada por tela. */
export function createMockRepositories(): Repositories {
  let profile: UserProfile | null = DEMO_PROFILE;
  let progression: Progression = { ...DEMO_PROGRESSION };
  let screening: HealthScreening | null = DEMO_SCREENING;
  let sessions: SessionSummary[] = [...DEMO_SESSIONS];
  let pain: PainLogEntry[] = [...DEMO_PAIN_LOG];
  let shadows: Shadow[] = SHADOWS.map((s) => ({ ...s }));
  const quests = new Map<string, DailyQuest>();

  return {
    profile: {
      async get() { return profile; },
      async save(p) { profile = p; },
    },
    progression: {
      async get() { return progression; },
      async save(p) { progression = p; },
    },
    screening: {
      async getLatest() { return screening; },
      async save(s) { screening = s; },
    },
    exercises: {
      async all() { return EXERCISES; },
      async byId(id) { return exerciseById(id) ?? null; },
    },
    quests: {
      async forDate(date) { return quests.get(date) ?? null; },
      async save(q) { quests.set(q.date, q); },
      async recentSessions(limit) { return sessions.slice(-limit); },
      async addSession(s) { sessions = [...sessions, s]; },
    },
    shadows: {
      async all() { return shadows; },
      async unlock(id, date) {
        shadows = shadows.map((s) => (s.id === id ? { ...s, unlockedAt: date } : s));
      },
    },
    pain: {
      async all() { return pain; },
      async add(e) { pain = [...pain, e]; },
    },
  };
}
