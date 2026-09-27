import { EXERCISES, exerciseById } from '../../data/exercises';
import { SHADOWS } from '../../data/shadows';
import { bool, json, unbool, unjson, type SqlDriver, type SqlValue } from '../db/driver';
import { migrate } from '../db/schema';
import { getDeviceId, newId } from '../ids';
import type { DomainEvent } from '../sync/events';
import { foldProgression, INITIAL_PROGRESSION } from '../sync/fold';
import type {
  DailyQuest, Equipment, HealthScreening, Limitation, PainLogEntry, Pattern,
  Progression, SessionSummary, Shadow, UserProfile,
} from '../types';
import type { Repositories } from './types';

type Row = Record<string, SqlValue>;

/**
 * Implementação SQLite. Mesmas interfaces do mock, mesmos tipos de domínio —
 * a troca é de origem de dados, não de contrato.
 *
 * A progressão NÃO é armazenada como estado autoritativo: ela é o fold do log
 * de eventos (`.kiro/specs/arise-backend/design.md` §1). A tabela
 * `progression_cache` existe só para leitura rápida na abertura do app, e é
 * sempre recalculável — se divergir, o log vence.
 */
export function createSqliteRepositories(db: SqlDriver): Repositories {
  migrate(db);

  const now = () => new Date().toISOString();
  const device = () => getDeviceId();

  // ── Eventos ───────────────────────────────────────────────────────────────

  function appendEvent(e: DomainEvent): void {
    const { id, at, deviceId, kind, ...payload } = e as DomainEvent & Record<string, unknown>;
    db.run(
      `insert into domain_event (id, kind, occurred_at, device_id, payload)
       values (?, ?, ?, ?, ?) on conflict(id) do nothing`,
      [id, kind, at, deviceId, json(payload)],
    );
  }

  function readEvents(): DomainEvent[] {
    return db
      .all<Row>('select id, kind, occurred_at, device_id, payload from domain_event order by occurred_at, id')
      .map((r) => ({
        id: String(r.id),
        kind: r.kind,
        at: String(r.occurred_at),
        deviceId: String(r.device_id),
        ...unjson<Record<string, unknown>>(r.payload, {}),
      }) as DomainEvent);
  }

  /**
   * Reconstrói tudo que é derivado do log: progressão, sombras e registro de
   * dor. Essas tabelas são PROJEÇÕES, não estado autoritativo — se divergirem
   * do log, o log vence.
   */
  function rebuildProjections(): Progression {
    const events = readEvents();

    db.transaction(() => {
      db.run('delete from shadow_state');
      for (const e of events) {
        if (e.kind !== 'shadow_unlocked') continue;
        db.run(
          `insert into shadow_state (shadow_id, unlocked_at) values (?, ?)
           on conflict(shadow_id) do nothing`, [e.shadowId, e.at],
        );
      }
      db.run('delete from pain_log');
      for (const e of events) {
        if (e.kind !== 'pain_logged') continue;
        db.run('insert into pain_log (id, occurred_at, pattern, kind) values (?,?,?,?)',
          [e.id, e.at, e.pattern, e.painKind]);
      }
    });

    const prog = foldProgression(events, foldContext());
    db.run(
      `insert into progression_cache
         (id, level, xp, rank, attributes, unspent_points, streak_current, streak_best, recovery_stones, folded_at)
       values (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(id) do update set
         level = excluded.level, xp = excluded.xp, rank = excluded.rank,
         attributes = excluded.attributes, unspent_points = excluded.unspent_points,
         streak_current = excluded.streak_current, streak_best = excluded.streak_best,
         recovery_stones = excluded.recovery_stones, folded_at = excluded.folded_at`,
      [prog.level, prog.xp, prog.rank, json(prog.attributes), prog.unspentPoints,
        prog.streakCurrent, prog.streakBest, prog.recoveryStones, now()],
    );
    return prog;
  }
  const refoldProgression = rebuildProjections;

  function foldContext() {
    const h = db.get<Row>(
      `select avg(steps) as steps, avg(sleep_min) as sleep from health_sample
       where measured_on >= date('now', '-28 day')`,
    );
    const read = db.get<Row>("select value from app_state where key = 'articles_read'");
    return {
      avgSteps: Number(h?.steps ?? 0),
      avgSleepHours: Number(h?.sleep ?? 420) / 60,
      mobilityScore: 50,
      articlesRead: Number(read?.value ?? 0),
      weeksPlanned: 0,
    };
  }

  // ── Mapeadores ────────────────────────────────────────────────────────────

  const toProfile = (r: Row): UserProfile => ({
    hunterName: String(r.hunter_name),
    age: Number(r.age),
    gender: r.gender as UserProfile['gender'],
    weightKg: Number(r.weight_kg),
    heightCm: Number(r.height_cm),
    waistCm: r.waist_cm === null ? null : Number(r.waist_cm),
    goal: r.goal as UserProfile['goal'],
    daysPerWeek: Number(r.days_per_week) as UserProfile['daysPerWeek'],
    sessionMinutes: Number(r.session_minutes) as UserProfile['sessionMinutes'],
    preferredTime: String(r.preferred_time),
    location: r.location as UserProfile['location'],
    equipment: unjson<Equipment[]>(r.equipment, []),
    limitations: unjson<Limitation[]>(r.limitations, []),
    units: unjson<UserProfile['units']>(r.units, { mass: 'kg', length: 'cm' }),
    locale: r.locale as UserProfile['locale'],
    systemTone: r.system_tone as UserProfile['systemTone'],
  });

  const toQuest = (r: Row): DailyQuest => ({
    id: String(r.id),
    date: String(r.quest_date),
    rank: r.rank as DailyQuest['rank'],
    objectives: unjson(r.objectives, []),
    status: r.status as DailyQuest['status'],
    deadline: String(r.deadline),
    isDeload: unbool(r.is_deload) ?? false,
    isRestDay: unbool(r.is_rest_day) ?? false,
    xpAwarded: r.xp_awarded === null ? null : Number(r.xp_awarded),
  });

  return {
    profile: {
      async get() {
        const r = db.get<Row>('select * from profile where id = 1');
        return r ? toProfile(r) : null;
      },
      async save(p) {
        db.run(
          `insert into profile (id, hunter_name, age, gender, weight_kg, height_cm, waist_cm,
             goal, days_per_week, session_minutes, preferred_time, location, equipment,
             limitations, units, locale, system_tone, updated_at, updated_by_device)
           values (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           on conflict(id) do update set
             hunter_name=excluded.hunter_name, age=excluded.age, gender=excluded.gender,
             weight_kg=excluded.weight_kg, height_cm=excluded.height_cm, waist_cm=excluded.waist_cm,
             goal=excluded.goal, days_per_week=excluded.days_per_week,
             session_minutes=excluded.session_minutes, preferred_time=excluded.preferred_time,
             location=excluded.location, equipment=excluded.equipment,
             limitations=excluded.limitations, units=excluded.units, locale=excluded.locale,
             system_tone=excluded.system_tone, updated_at=excluded.updated_at,
             updated_by_device=excluded.updated_by_device`,
          [p.hunterName, p.age, p.gender, p.weightKg, p.heightCm, p.waistCm, p.goal,
            p.daysPerWeek, p.sessionMinutes, p.preferredTime, p.location,
            json(p.equipment), json(p.limitations), json(p.units), p.locale,
            p.systemTone, now(), device()],
        );
      },
      async isOnboarded() {
        const r = db.get<Row>('select onboarded from profile where id = 1');
        return (unbool(r?.onboarded ?? 0) ?? false) === true;
      },
      async completeOnboarding(startedAt = now().slice(0, 10)) {
        db.transaction(() => {
          db.run('update profile set onboarded = 1, updated_at = ? where id = 1', [now()]);
          db.run(
            `insert into app_state (key, value) values ('started_at', ?)
             on conflict(key) do nothing`, [startedAt],
          );
        });
      },
      async startedAt() {
        const r = db.get<Row>("select value from app_state where key = 'started_at'");
        return r ? String(r.value) : null;
      },
    },

    progression: {
      async get() {
        const r = db.get<Row>('select * from progression_cache where id = 1');
        if (!r) return refoldProgression();
        return {
          level: Number(r.level),
          xp: Number(r.xp),
          rank: r.rank as Progression['rank'],
          attributes: unjson(r.attributes, INITIAL_PROGRESSION.attributes),
          unspentPoints: Number(r.unspent_points),
          streakCurrent: Number(r.streak_current),
          streakBest: Number(r.streak_best),
          recoveryStones: Number(r.recovery_stones),
        };
      },
      /**
       * Escrever progressão direto é degradado a cache: a verdade é o log.
       * Quem quer alterar progressão emite evento (`events.append`).
       */
      async save() { refoldProgression(); },
    },

    screening: {
      async getLatest() {
        const r = db.get<Row>('select * from health_screening order by taken_on desc limit 1');
        if (!r) return null;
        return {
          date: String(r.taken_on),
          answers: unjson(r.answers, {}),
          result: r.result as HealthScreening['result'],
          restrictions: unjson<Limitation[]>(r.restrictions, []),
          expiresAt: String(r.expires_at),
        };
      },
      async save(s) {
        db.run(
          `insert into health_screening (id, taken_on, answers, result, restrictions,
             expires_at, updated_at, updated_by_device)
           values (?,?,?,?,?,?,?,?)
           on conflict(taken_on) do update set
             answers=excluded.answers, result=excluded.result,
             restrictions=excluded.restrictions, expires_at=excluded.expires_at,
             updated_at=excluded.updated_at, updated_by_device=excluded.updated_by_device`,
          [newId(), s.date, json(s.answers), s.result, json(s.restrictions),
            s.expiresAt, now(), device()],
        );
      },
    },

    // Catálogo é estático e viaja no app, não no banco.
    exercises: {
      async all() { return EXERCISES; },
      async byId(id) { return exerciseById(id) ?? null; },
    },

    quests: {
      async forDate(date) {
        const r = db.get<Row>('select * from daily_quest where quest_date = ?', [date]);
        return r ? toQuest(r) : null;
      },
      async between(from, to) {
        return db
          .all<Row>('select * from daily_quest where quest_date between ? and ? order by quest_date', [from, to])
          .map(toQuest);
      },
      async save(q) {
        db.run(
          `insert into daily_quest (id, quest_date, rank, objectives, status, deadline,
             is_deload, is_rest_day, xp_awarded, updated_at, updated_by_device)
           values (?,?,?,?,?,?,?,?,?,?,?)
           on conflict(quest_date) do update set
             rank=excluded.rank, objectives=excluded.objectives, status=excluded.status,
             deadline=excluded.deadline, is_deload=excluded.is_deload,
             is_rest_day=excluded.is_rest_day, xp_awarded=excluded.xp_awarded,
             updated_at=excluded.updated_at, updated_by_device=excluded.updated_by_device`,
          [q.id, q.date, q.rank, json(q.objectives), q.status, q.deadline,
            bool(q.isDeload), bool(q.isRestDay), q.xpAwarded, now(), device()],
        );
      },
      /**
       * Lidas do LOG, não de uma tabela à parte: uma versão anterior lia
       * `session_log`, e sessões vindas de um backup importado sumiam do
       * histórico porque só existiam como evento.
       */
      async recentSessions(limit) {
        return readEvents()
          .filter((e): e is Extract<DomainEvent, { kind: 'session_completed' }> =>
            e.kind === 'session_completed' && !e.session.rest)
          .map((e) => e.session)
          .slice(-limit);
      },
      async addSession(s) {
        appendEvent({
          id: newId(), at: `${s.date}T12:00:00.000Z`, deviceId: device(),
          kind: 'session_completed', session: s,
        });
        refoldProgression();
      },
    },

    shadows: {
      async all() {
        const unlocked = new Map(
          db.all<Row>('select shadow_id, unlocked_at from shadow_state')
            .map((r) => [String(r.shadow_id), r.unlocked_at as string | null]),
        );
        return SHADOWS.map((s): Shadow => ({ ...s, unlockedAt: unlocked.get(s.id) ?? null }));
      },
      async unlock(id, date) {
        // Id determinístico: desbloquear a mesma sombra duas vezes é no-op,
        // inclusive vindo de dois aparelhos.
        appendEvent({
          id: `shadow:${id}`, at: date, deviceId: device(),
          kind: 'shadow_unlocked', shadowId: id,
        });
        rebuildProjections();
      },
    },

    pain: {
      async all() {
        return db.all<Row>('select * from pain_log order by occurred_at').map((r): PainLogEntry => ({
          date: String(r.occurred_at).slice(0, 10),
          pattern: r.pattern as Pattern,
          kind: r.kind as PainLogEntry['kind'],
        }));
      },
      async add(e) {
        appendEvent({
          id: `pain:${e.date}:${e.pattern}:${e.kind}`,
          at: `${e.date}T12:00:00.000Z`, deviceId: device(),
          kind: 'pain_logged', pattern: e.pattern, painKind: e.kind,
        });
        rebuildProjections();
      },
    },

    events: {
      async append(e) {
        appendEvent(e);
        refoldProgression();
      },
      async all() { return readEvents(); },
      async unsynced(limit) {
        return db
          .all<Row>(
            `select id, kind, occurred_at, device_id, payload from domain_event
             where synced_at is null order by occurred_at, id limit ?`, [limit])
          .map((r) => ({
            id: String(r.id), kind: r.kind, at: String(r.occurred_at),
            deviceId: String(r.device_id),
            ...unjson<Record<string, unknown>>(r.payload, {}),
          }) as DomainEvent);
      },
      async markSynced(ids) {
        if (ids.length === 0) return;
        const at = now();
        db.transaction(() => {
          for (const id of ids) {
            db.run('update domain_event set synced_at = ? where id = ?', [at, id]);
          }
        });
      },
      async refold() { return refoldProgression(); },
    },

    app: {
      async wipe() {
        db.transaction(() => {
          for (const t of [
            'set_log', 'session_log', 'domain_event', 'daily_quest', 'health_screening',
            'shadow_state', 'pain_log', 'body_metric', 'health_sample', 'progression_cache',
            'profile', 'app_state',
          ]) db.run(`delete from ${t}`);
        });
      },
      async getValue(key) {
        const r = db.get<Row>('select value from app_state where key = ?', [key]);
        return r ? String(r.value) : null;
      },
      async setValue(key, value) {
        db.run(`insert into app_state (key, value) values (?, ?)
                on conflict(key) do update set value = excluded.value`, [key, value]);
      },
    },
  };
}
