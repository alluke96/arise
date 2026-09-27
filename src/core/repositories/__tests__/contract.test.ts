import { beforeEach, describe, expect, it } from 'vitest';
import { createMockRepositories } from '../mock';
import { createSqliteRepositories } from '../sqlite';
import { createNodeDriver } from '../../db/driver.node';
import type { Repositories } from '../types';
import type { HealthScreening, SessionSummary, UserProfile } from '../../types';

/**
 * Suíte de CONTRATO.
 *
 * Roda exatamente os mesmos casos contra a implementação em memória e contra
 * SQLite real. É isso que garante que a Fase 2 é troca de origem de dados e
 * não reescrita: se as duas divergirem em qualquer comportamento observável,
 * um destes casos quebra.
 *
 * O SQLite aqui é `node:sqlite` rodando o MESMO SQL que o `expo-sqlite` roda
 * no aparelho — não um dublê.
 */
const profile: UserProfile = {
  hunterName: 'TESTE', age: 30, gender: 'female', weightKg: 62.5, heightCm: 168,
  waistCm: null, goal: 'health', daysPerWeek: 3, sessionMinutes: 20,
  preferredTime: '07:00', location: 'home', equipment: ['none'], limitations: ['knee'],
  units: { mass: 'kg', length: 'cm' }, locale: 'pt-BR', systemTone: 'cold',
};

const screening: HealthScreening = {
  date: '2026-09-01', answers: { bone_joint: true }, result: 'caution',
  restrictions: ['knee'], expiresAt: '2027-09-01',
};

const session = (date: string, over: Partial<SessionSummary> = {}): SessionSummary => ({
  date, durationMin: 20, avgRpe: 5, completion: 'complete',
  resistedVolume: 400, aerobicMinutes: 20, formOkRatio: 0.9, ...over,
});

const IMPLS: [string, () => Repositories][] = [
  ['mock (memoria)', () => createMockRepositories()],
  ['sqlite (node:sqlite)', () => createSqliteRepositories(createNodeDriver(':memory:'))],
];

describe.each(IMPLS)('contrato de repositorio — %s', (_name, make) => {
  let repos: Repositories;
  beforeEach(() => { repos = make(); });

  describe('perfil', () => {
    it('grava e le de volta sem perder campo', async () => {
      await repos.profile.save(profile);
      expect(await repos.profile.get()).toEqual(profile);
    });

    it('sobrescreve em vez de duplicar', async () => {
      await repos.profile.save(profile);
      await repos.profile.save({ ...profile, hunterName: 'OUTRO' });
      expect((await repos.profile.get())?.hunterName).toBe('OUTRO');
    });

    it('preserva arrays e objetos aninhados', async () => {
      const p: UserProfile = { ...profile, equipment: ['band', 'dumbbell'], limitations: [] };
      await repos.profile.save(p);
      const back = await repos.profile.get();
      expect(back?.equipment).toEqual(['band', 'dumbbell']);
      expect(back?.limitations).toEqual([]);
    });

    it('preserva waistCm nulo', async () => {
      await repos.profile.save(profile);
      expect((await repos.profile.get())?.waistCm).toBeNull();
    });

    it('onboarding comeca incompleto e e marcavel', async () => {
      await repos.profile.save(profile);
      expect(await repos.profile.isOnboarded()).toBe(false);
      await repos.profile.completeOnboarding();
      expect(await repos.profile.isOnboarded()).toBe(true);
    });
  });

  describe('triagem', () => {
    it('grava e le a mais recente', async () => {
      await repos.screening.save(screening);
      expect(await repos.screening.getLatest()).toEqual(screening);
    });

    it('a mais recente vence', async () => {
      await repos.screening.save(screening);
      await repos.screening.save({ ...screening, date: '2026-09-15', result: 'cleared' });
      expect((await repos.screening.getLatest())?.result).toBe('cleared');
    });
  });

  describe('missoes', () => {
    it('devolve null para data sem missao', async () => {
      expect(await repos.quests.forDate('2026-01-01')).toBeNull();
    });

    it('grava e le por data', async () => {
      const quest = {
        id: 'q1', date: '2026-09-21', rank: 'D' as const,
        objectives: [{
          exerciseId: 'push_knee', targetValue: 24, unit: 'reps' as const,
          actualValue: 18, rpe: 5 as const, formOk: true, completedAt: null,
        }],
        status: 'partial' as const, deadline: '2026-09-21T23:59:59',
        isDeload: false, isRestDay: false, xpAwarded: null,
      };
      await repos.quests.save(quest);
      expect(await repos.quests.forDate('2026-09-21')).toEqual(quest);
    });

    it('sessoes voltam em ordem cronologica', async () => {
      await repos.quests.addSession(session('2026-09-01'));
      await repos.quests.addSession(session('2026-09-03'));
      await repos.quests.addSession(session('2026-09-05'));
      const out = await repos.quests.recentSessions(10);
      expect(out.map((s) => s.date)).toEqual(['2026-09-01', '2026-09-03', '2026-09-05']);
    });

    it('recentSessions respeita o limite, mantendo as mais novas', async () => {
      for (const d of ['01', '02', '03', '04', '05']) {
        await repos.quests.addSession(session(`2026-09-${d}`));
      }
      const out = await repos.quests.recentSessions(2);
      expect(out.map((s) => s.date)).toEqual(['2026-09-04', '2026-09-05']);
    });
  });

  describe('sombras', () => {
    it('o catalogo nao esta vazio', async () => {
      expect((await repos.shadows.all()).length).toBeGreaterThan(0);
    });

    it('desbloquear grava a data', async () => {
      const [first] = await repos.shadows.all();
      await repos.shadows.unlock(first.id, '2026-09-21');
      const after = (await repos.shadows.all()).find((s) => s.id === first.id);
      expect(after?.unlockedAt).toBe('2026-09-21');
    });

    it('desbloquear duas vezes nao duplica', async () => {
      const [first] = await repos.shadows.all();
      await repos.shadows.unlock(first.id, '2026-09-21');
      await repos.shadows.unlock(first.id, '2026-09-22');
      const all = await repos.shadows.all();
      expect(all.filter((s) => s.id === first.id)).toHaveLength(1);
    });
  });

  describe('dor', () => {
    it('acumula registros', async () => {
      await repos.pain.add({ date: '2026-09-01', pattern: 'squat', kind: 'joint' });
      await repos.pain.add({ date: '2026-09-05', pattern: 'squat', kind: 'joint' });
      expect(await repos.pain.all()).toHaveLength(2);
    });

    it('distingue dor articular de muscular', async () => {
      await repos.pain.add({ date: '2026-09-01', pattern: 'squat', kind: 'joint' });
      await repos.pain.add({ date: '2026-09-02', pattern: 'push_h', kind: 'muscle' });
      const all = await repos.pain.all();
      expect(all.filter((p) => p.kind === 'joint')).toHaveLength(1);
      expect(all.filter((p) => p.kind === 'muscle')).toHaveLength(1);
    });
  });

  describe('eventos', () => {
    it('registrar sessao gera evento', async () => {
      await repos.quests.addSession(session('2026-09-01'));
      const events = await repos.events.all();
      expect(events.filter((e) => e.kind === 'session_completed')).toHaveLength(1);
    });

    it('reenviar o mesmo evento e no-op', async () => {
      const e = {
        id: 'fixo-1', at: '2026-09-01T10:00:00.000Z', deviceId: 'd',
        kind: 'penalty_completed' as const,
      };
      await repos.events.append(e);
      await repos.events.append(e);
      await repos.events.append(e);
      expect((await repos.events.all()).filter((x) => x.id === 'fixo-1')).toHaveLength(1);
    });

    it('o evento sobrevive a ida e volta pelo armazenamento', async () => {
      const e = {
        id: 'fixo-2', at: '2026-09-02T10:00:00.000Z', deviceId: 'd',
        kind: 'benchmark_passed' as const, rankAfter: 'C' as const,
      };
      await repos.events.append(e);
      expect((await repos.events.all()).find((x) => x.id === 'fixo-2')).toEqual(e);
    });

    it('unsynced devolve so o que falta enviar, em ordem', async () => {
      for (const d of ['01', '02', '03']) {
        await repos.events.append({
          id: `e-${d}`, at: `2026-09-${d}T10:00:00.000Z`, deviceId: 'd',
          kind: 'penalty_completed',
        });
      }
      expect((await repos.events.unsynced(10)).map((e) => e.id)).toEqual(['e-01', 'e-02', 'e-03']);
      await repos.events.markSynced(['e-01', 'e-02']);
      expect((await repos.events.unsynced(10)).map((e) => e.id)).toEqual(['e-03']);
    });

    it('a progressao e o fold do log', async () => {
      await repos.events.append({
        id: 'g1', at: '2026-09-01T00:00:00.000Z', deviceId: 'd',
        kind: 'stone_granted', amount: 2,
      });
      await repos.events.append({
        id: 'b1', at: '2026-09-02T00:00:00.000Z', deviceId: 'd',
        kind: 'benchmark_passed', rankAfter: 'D',
      });
      const prog = await repos.events.refold();
      expect(prog.rank).toBe('D');
      expect(prog.recoveryStones).toBe(2);
    });
  });
});

describe('migrations', () => {
  it('rodar duas vezes e idempotente', async () => {
    const driver = createNodeDriver(':memory:');
    createSqliteRepositories(driver);
    createSqliteRepositories(driver);
    const rows = driver.all<{ c: number }>('select count(*) as c from schema_migrations');
    expect(rows[0].c).toBe(1);
  });

  it('os dados sobrevivem a reabrir o mesmo banco', async () => {
    const driver = createNodeDriver(':memory:');
    const a = createSqliteRepositories(driver);
    await a.profile.save(profile);
    const b = createSqliteRepositories(driver);
    expect((await b.profile.get())?.hunterName).toBe('TESTE');
  });
});
