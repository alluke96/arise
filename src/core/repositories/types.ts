import type { DomainEvent } from '../sync/events';
import type {
  DailyQuest, Exercise, HealthScreening, PainLogEntry,
  Progression, SessionSummary, Shadow, UserProfile,
} from '../types';

/**
 * Interfaces de repositório.
 *
 * A Fase 1 injeta a implementação em memória; a Fase 2 injeta SQLite.
 * Nem a UI nem o motor mudam na troca — é isso que torna a Fase 2 uma
 * substituição de origem, e não uma reescrita.
 */
export interface ProfileRepository {
  get(): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<void>;
  /** Decide entre o fluxo de onboarding e as abas na abertura do app. */
  isOnboarded(): Promise<boolean>;
  completeOnboarding(): Promise<void>;
}

export interface ProgressionRepository {
  get(): Promise<Progression>;
  save(progression: Progression): Promise<void>;
}

export interface ScreeningRepository {
  getLatest(): Promise<HealthScreening | null>;
  save(screening: HealthScreening): Promise<void>;
}

export interface ExerciseRepository {
  all(): Promise<Exercise[]>;
  byId(id: string): Promise<Exercise | null>;
}

export interface QuestRepository {
  forDate(date: string): Promise<DailyQuest | null>;
  save(quest: DailyQuest): Promise<void>;
  recentSessions(limit: number): Promise<SessionSummary[]>;
  addSession(session: SessionSummary): Promise<void>;
}

export interface ShadowRepository {
  all(): Promise<Shadow[]>;
  unlock(id: string, date: string): Promise<void>;
}

export interface PainRepository {
  all(): Promise<PainLogEntry[]>;
  add(entry: PainLogEntry): Promise<void>;
}

/**
 * Log de eventos: a fonte da verdade da progressão. Ver
 * `.kiro/specs/arise-backend/design.md` §1.
 */
export interface EventRepository {
  append(event: DomainEvent): Promise<void>;
  all(): Promise<DomainEvent[]>;
  /** Pendentes de envio ao servidor, em ordem. */
  unsynced(limit: number): Promise<DomainEvent[]>;
  markSynced(ids: string[]): Promise<void>;
  /** Recalcula a progressão a partir do log. */
  refold(): Promise<Progression>;
}

export interface Repositories {
  profile: ProfileRepository;
  progression: ProgressionRepository;
  screening: ScreeningRepository;
  exercises: ExerciseRepository;
  quests: QuestRepository;
  shadows: ShadowRepository;
  pain: PainRepository;
  events: EventRepository;
}
