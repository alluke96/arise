import { EXERCISES, exerciseById } from '../../data/exercises';
import { SHADOWS } from '../../data/shadows';
import { INITIAL_PROGRESSION } from '../sync/fold';
import { newId } from '../ids';
import { normalizeEvents, type DomainEvent } from '../sync/events';
import { foldProgression } from '../sync/fold';
import type {
  DailyQuest, HealthScreening, PainLogEntry, Progression,
  SessionSummary, Shadow, UserProfile,
} from '../types';
import type { Repositories } from './types';

/**
 * Semente opcional. O repositório nasce VAZIO por padrão: um repositório que
 * já vem populado é contrato surpreendente, e foi exatamente a divergência
 * que a suíte de contrato pegou entre esta implementação e a SQLite.
 * Quem quer o caçador de demonstração pede explicitamente.
 */
export interface MockSeed {
  profile?: UserProfile;
  onboarded?: boolean;
  startedAt?: string;
  screening?: HealthScreening;
  /** O estado do caçador vem do LOG — progressão, sombras e dor são projeções. */
  events?: DomainEvent[];
  quests?: DailyQuest[];
}

/** Implementação em memória. Mesma interface que a SQLite implementa,
 *  mesmos tipos de domínio — nenhuma forma inventada por tela. */
export function createMockRepositories(seed: MockSeed = {}): Repositories {
  let profile: UserProfile | null = seed.profile ?? null;
  let onboarded = seed.onboarded ?? false;
  let startedAt: string | null = seed.startedAt ?? null;
  let progression: Progression = { ...INITIAL_PROGRESSION, attributes: { ...INITIAL_PROGRESSION.attributes } };
  let screening: HealthScreening | null = seed.screening ?? null;
  let pain: PainLogEntry[] = [];
  let shadows: Shadow[] = SHADOWS.map((s) => ({ ...s }));
  const quests = new Map<string, DailyQuest>((seed.quests ?? []).map((q) => [q.date, q]));
  let events: DomainEvent[] = [...(seed.events ?? [])];
  const state = new Map<string, string>();
  const synced = new Set<string>();

  function appendEvent(e: DomainEvent): void {
    if (events.some((x) => x.id === e.id)) return;
    events = [...events, e];
  }

  /** Sombras e dor são PROJEÇÕES do log, igual ao repositório SQLite. */
  function rebuildProjections(): Progression {
    const unlocked = new Map<string, string>();
    for (const e of events) {
      if (e.kind === 'shadow_unlocked' && !unlocked.has(e.shadowId)) {
        unlocked.set(e.shadowId, e.at);
      }
    }
    shadows = shadows.map((s) => ({ ...s, unlockedAt: unlocked.get(s.id) ?? null }));

    pain = events
      .filter((e) => e.kind === 'pain_logged')
      .map((e) => ({
        date: e.at.slice(0, 10),
        pattern: (e as Extract<DomainEvent, { kind: 'pain_logged' }>).pattern,
        kind: (e as Extract<DomainEvent, { kind: 'pain_logged' }>).painKind,
      }));

    progression = foldProgression(events);
    return progression;
  }

  rebuildProjections();

  return {
    profile: {
      async get() { return profile; },
      async save(p) { profile = p; },
      async isOnboarded() { return onboarded; },
      async completeOnboarding(date = new Date().toISOString().slice(0, 10)) {
        onboarded = true;
        startedAt = startedAt ?? date;
      },
      async startedAt() { return startedAt; },
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
      async between(from, to) {
        return [...quests.values()].filter((q) => q.date >= from && q.date <= to)
          .sort((a, b) => (a.date < b.date ? -1 : 1));
      },
      async save(q) { quests.set(q.date, q); },
      async recentSessions(limit) {
        return events
          .filter((e): e is Extract<DomainEvent, { kind: 'session_completed' }> =>
            e.kind === 'session_completed' && !e.session.rest)
          .sort((a, b) => (a.at < b.at ? -1 : 1))
          .map((e) => e.session)
          .slice(-limit);
      },
      async addSession(s) {
        appendEvent({
          id: newId(), at: `${s.date}T12:00:00.000Z`, deviceId: 'mock',
          kind: 'session_completed', session: s,
        });
        rebuildProjections();
      },
    },
    shadows: {
      async all() { return shadows; },
      async unlock(id, date) {
        appendEvent({
          id: `shadow:${id}`, at: date, deviceId: 'mock',
          kind: 'shadow_unlocked', shadowId: id,
        });
        rebuildProjections();
      },
    },
    pain: {
      async all() { return pain; },
      async add(e) {
        appendEvent({
          id: `pain:${e.date}:${e.pattern}:${e.kind}`,
          at: `${e.date}T12:00:00.000Z`, deviceId: 'mock',
          kind: 'pain_logged', pattern: e.pattern, painKind: e.kind,
        });
        rebuildProjections();
      },
    },
    events: {
      async append(e) {
        appendEvent(e);
        rebuildProjections();
      },
      async all() { return normalizeEvents(events); },
      async unsynced(limit) {
        return normalizeEvents(events).filter((e) => !synced.has(e.id)).slice(0, limit);
      },
      async markSynced(ids) { for (const id of ids) synced.add(id); },
      async refold() { return rebuildProjections(); },
    },
    app: {
      async wipe() {
        profile = null; onboarded = false; startedAt = null; screening = null;
        events = []; quests.clear(); synced.clear(); state.clear();
        rebuildProjections();
      },
      async getValue(key) { return state.get(key) ?? null; },
      async setValue(key, value) { state.set(key, value); },
    },
  };
}
