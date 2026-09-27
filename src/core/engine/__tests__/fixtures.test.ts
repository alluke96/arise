import { describe, expect, it } from 'vitest';
import { levelProgress, xpForLevel } from '../xp';
import { reconcile } from '../calendar';
import { foldAll } from '../../sync/fold';
import { buildDemo } from '../../../data/mocks/demo';
import { createMockRepositories } from '../../repositories/mock';

/**
 * O demo é gerado pelo motor, então consistência é esperada — mas é testada,
 * não confiada. Foi um fixture solto ("nível 14 com 5.240 XP", quando 5.074
 * já era nível 15) que fez a barra de XP aparecer estourada numa versão
 * anterior.
 */
const TODAY = '2026-09-28';
const demo = buildDemo(TODAY);
const { progression, streak } = foldAll(demo.events);

describe('caçador de demonstração', () => {
  it('o XP cai dentro da faixa do nível', () => {
    expect(progression.xp).toBeGreaterThanOrEqual(xpForLevel(progression.level));
    expect(progression.xp).toBeLessThan(xpForLevel(progression.level + 1));
    const { ratio } = levelProgress(progression);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });

  it('conta a história prevista: começou no E e foi promovido ao D', () => {
    expect(progression.rank).toBe('D');
    expect(progression.level).toBeGreaterThan(3);
    expect(progression.streakCurrent).toBeGreaterThan(5);
  });

  it('tem sombras extraídas pelo motor, não escritas à mão', () => {
    const shadows = demo.events.filter((e) => e.kind === 'shadow_unlocked');
    expect(shadows.length).toBeGreaterThanOrEqual(3);
  });

  it('o tropeço da semana 3 foi resolvido pela Zona de Penalidade', () => {
    expect(demo.events.some((e) => e.kind === 'penalty_completed')).toBe(true);
    expect(demo.events.some((e) => e.kind === 'penalty_skipped')).toBe(false);
  });

  it('termina em dia: abrir o app hoje não gera dívida nem Dungeon Break', () => {
    const r = reconcile({ events: demo.events, today: TODAY, daysPerWeek: 3, startedAt: demo.startedAt, deviceId: 'x' });
    expect(r.toAppend.filter((e) => !e.id.startsWith('stone_grant'))).toEqual([]);
    expect(r.penaltyOpenFor).toBeNull();
    expect(streak.reentrySessionsLeft).toBe(0);
  });

  it('é reproduzível', () => {
    expect(buildDemo(TODAY).events).toEqual(demo.events);
  });

  /** O bug que motivou a reescrita: concluir no demo zerava o nível. */
  it('concluir uma missão no demo nunca derruba o nível', async () => {
    const repos = createMockRepositories({ events: demo.events, profile: demo.profile, onboarded: true });
    const before = await repos.progression.get();
    await repos.quests.addSession({
      date: TODAY, durationMin: 20, avgRpe: 5, completion: 'complete',
      resistedVolume: 300, aerobicMinutes: 20, formOkRatio: 1,
    });
    const after = await repos.progression.get();
    expect(after.level).toBeGreaterThanOrEqual(before.level);
    expect(after.xp).toBeGreaterThan(before.xp);
  });
});
