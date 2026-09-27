import { describe, expect, it } from 'vitest';
import {
  EXPORT_FORMAT, InvalidBundleError, buildBundle, parseBundle,
  restoreBundle, serializeBundle, suggestedFileName,
} from '../backup';
import { createSqliteRepositories } from '../../repositories/sqlite';
import { createNodeDriver } from '../driver.node';
import type { UserProfile } from '../../types';

const profile: UserProfile = {
  hunterName: 'ALLYSON', age: 28, gender: 'male', weightKg: 89.1, heightCm: 178,
  waistCm: 97, goal: 'fat_loss', daysPerWeek: 3, sessionMinutes: 20,
  preferredTime: '19:00', location: 'home', equipment: ['none'], limitations: ['wrist'],
  units: { mass: 'kg', length: 'cm' }, locale: 'pt-BR', systemTone: 'cold',
};

const fresh = () => createSqliteRepositories(createNodeDriver(':memory:'));

async function populated() {
  const r = fresh();
  await r.profile.save(profile);
  await r.screening.save({
    date: '2026-09-01', answers: {}, result: 'cleared',
    restrictions: [], expiresAt: '2027-09-01',
  });
  await r.quests.addSession({
    date: '2026-09-02', durationMin: 20, avgRpe: 5, completion: 'complete',
    resistedVolume: 400, aerobicMinutes: 20, formOkRatio: 0.9,
  });
  await r.events.append({
    id: 'bench-1', at: '2026-09-03T10:00:00.000Z', deviceId: 'd',
    kind: 'benchmark_passed', rankAfter: 'D',
  });
  await r.shadows.unlock('sentinela', '2026-09-02');
  await r.pain.add({ date: '2026-09-04', pattern: 'squat', kind: 'muscle' });
  return r;
}

describe('exportação', () => {
  it('produz um envelope identificável e versionado', async () => {
    const b = await buildBundle(await populated());
    expect(b.format).toBe(EXPORT_FORMAT);
    expect(b.version).toBe(1);
    expect(b.profile?.hunterName).toBe('ALLYSON');
  });

  it('inclui o log de eventos completo', async () => {
    const b = await buildBundle(await populated());
    expect(b.events.length).toBeGreaterThanOrEqual(4);
    expect(b.events.some((e) => e.kind === 'benchmark_passed')).toBe(true);
  });

  it('exporta só as sombras desbloqueadas', async () => {
    const b = await buildBundle(await populated());
    expect(b.shadows).toEqual([{ id: 'sentinela', unlockedAt: '2026-09-02' }]);
  });

  it('o nome de arquivo carrega a data', () => {
    expect(suggestedFileName(new Date('2026-09-21T10:00:00Z')))
      .toBe('arise-backup-2026-09-21.json');
  });
});

describe('ida e volta', () => {
  it('restaurar num banco vazio reconstrói o estado', async () => {
    const bundle = await buildBundle(await populated());
    const target = fresh();

    const report = await restoreBundle(target, parseBundle(serializeBundle(bundle)));

    expect(report.profileRestored).toBe(true);
    expect((await target.profile.get())?.hunterName).toBe('ALLYSON');
    expect((await target.screening.getLatest())?.result).toBe('cleared');
    expect((await target.events.all()).length).toBe(bundle.events.length);
    expect((await target.progression.get()).rank).toBe('D');
  });

  it('restaurar duas vezes não duplica evento', async () => {
    const bundle = await buildBundle(await populated());
    const target = fresh();
    await restoreBundle(target, bundle);
    const afterFirst = (await target.events.all()).length;
    await restoreBundle(target, bundle);
    expect((await target.events.all()).length).toBe(afterFirst);
  });

  /** Importar backup de outro aparelho funde históricos, não sobrescreve. */
  it('une dois históricos em vez de um sobrescrever o outro', async () => {
    const a = fresh();
    await a.events.append({
      id: 'a-1', at: '2026-09-01T10:00:00.000Z', deviceId: 'a', kind: 'penalty_completed',
    });
    const b = fresh();
    await b.events.append({
      id: 'b-1', at: '2026-09-02T10:00:00.000Z', deviceId: 'b', kind: 'penalty_completed',
    });

    await restoreBundle(a, await buildBundle(b));
    const ids = (await a.events.all()).map((e) => e.id);
    expect(ids).toContain('a-1');
    expect(ids).toContain('b-1');
  });
});

describe('validação', () => {
  it('recusa conteúdo que não é JSON', () => {
    expect(() => parseBundle('nao e json')).toThrow(InvalidBundleError);
  });

  it('recusa JSON de outro app', () => {
    expect(() => parseBundle('{"format":"outro","version":1}')).toThrow(/não é um backup/);
  });

  it('recusa backup de versão futura em vez de corromper o dado', () => {
    expect(() => parseBundle(JSON.stringify({ format: EXPORT_FORMAT, version: 99 })))
      .toThrow(/versão mais nova/);
  });

  it('recusa envelope sem os arrays esperados', () => {
    expect(() => parseBundle(JSON.stringify({ format: EXPORT_FORMAT, version: 1 })))
      .toThrow(/events/);
  });

  it('recusa evento malformado', () => {
    const raw = JSON.stringify({
      format: EXPORT_FORMAT, version: 1, events: [{ id: 1 }],
      sessions: [], quests: [], shadows: [], pain: [],
    });
    expect(() => parseBundle(raw)).toThrow(/malformado/);
  });

  it('valida antes de escrever: um arquivo ruim não toca no histórico', async () => {
    const target = await populated();
    const before = (await target.events.all()).length;
    expect(() => parseBundle('{"format":"arise.export","version":1}')).toThrow();
    expect((await target.events.all()).length).toBe(before);
  });
});
