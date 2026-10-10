import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Repositories } from '../../core/repositories/types';
import type { SqlDriver } from '../../core/db/driver';

/**
 * USO REAL POR SEMANAS, COM O APP SENDO FECHADO E REABERTO.
 *
 * Roda a store de verdade (a mesma que as telas usam) contra o MESMO SQLite
 * do aparelho, gravando em ARQUIVO. Depois de cada dia o "app" é fechado
 * (conexão encerrada, memória zerada) e reaberto do disco: tudo que a tela
 * mostrava antes precisa voltar igual. Inclui fechar o app NO MEIO de um
 * exercício, faltar treino, penalidade, dia parcial, descanso e a virada de
 * dia com a sessão aberta.
 */
const holder = vi.hoisted(() => ({ repos: null as unknown as Repositories }));

vi.mock('../../core/repositories', () => ({
  DEMO_MODE: false,
  // A store guarda a referência deste objeto: o proxy deixa "reabrir o app"
  // trocar a conexão por baixo sem a store perceber.
  repositories: new Proxy({}, { get: (_t, key) => holder.repos[key as keyof Repositories] }),
}));

const { createSqliteRepositories } = await import('../../core/repositories/sqlite');
const { createNodeDriver } = await import('../../core/db/driver.node');
const { useHunter } = await import('../hunter/store');
const { useOnboarding, DEFAULT_DRAFT } = await import('../onboarding/store');
const { getDayOffset, setDayOffset } = await import('../../core/clock');
const { EXERCISES } = await import('../../data/exercises');
const { foldAll } = await import('../../core/sync/fold');
const { buildBundle, parseBundle, restoreBundle, serializeBundle } = await import('../../core/db/backup');

let dir = '';
let driver: SqlDriver;
const initialState = useHunter.getState();

function open(): void {
  driver = createNodeDriver(join(dir, 'arise.db'));
  holder.repos = createSqliteRepositories(driver);
}

/** Fecha o app: encerra a conexão e apaga toda a memória. Reabre do disco. */
async function restartApp(): Promise<void> {
  driver.close();
  useHunter.setState(initialState, true);
  open();
  await useHunter.getState().boot();
}

/** O que a tela mostra — tem que sobreviver a fechar e abrir o app. */
function visibleState() {
  const s = useHunter.getState();
  return {
    today: s.today,
    progression: s.progression,
    streak: s.streak,
    ladder: s.ladder,
    unlockedShadows: [...s.unlockedShadows].sort(),
    shadowProgress: s.shadowProgress,
    quest: s.quest,
    penaltyOpenFor: s.penaltyOpenFor,
    events: s.events.length,
  };
}

/** Faz um exercício tocando repetição por repetição, como na tela. */
function doReps(exerciseId: string, upTo: number): void {
  for (;;) {
    const o = useHunter.getState().quest!.objectives.find((x) => x.exerciseId === exerciseId)!;
    if (o.actualValue >= Math.min(upTo, o.targetValue)) return;
    useHunter.getState().recordValue(exerciseId, o.actualValue + 1);
  }
}

async function trainFully(): Promise<void> {
  const h = useHunter.getState();
  for (const o of h.quest!.objectives) {
    doReps(o.exerciseId, o.targetValue);
    await useHunter.getState().finishObjective(o.exerciseId, 5, true);
  }
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'arise-longrun-'));
  setDayOffset(0);
  open();
  // Onboarding de verdade, pela mesma store da tela.
  useOnboarding.setState({
    draft: { ...DEFAULT_DRAFT, hunterName: 'teste', equipment: ['none'], daysPerWeek: 3, sessionMinutes: 20 },
    parq: {},
  });
  await useOnboarding.getState().commit();
  await restartApp();
});

afterAll(() => {
  driver.close();
  setDayOffset(0);
  rmSync(dir, { recursive: true, force: true });
});

describe('cinco semanas de uso real, fechando e abrindo o app todo dia', () => {
  const DAYS = 35;
  const log: { day: number; kind: string }[] = [];
  const xpPerSession: number[] = [];

  it('nenhum dado se perde e o estado reaberto é idêntico ao de antes', async () => {
    let skippedOnce = false;
    let partialOnce = false;
    let crashedMidExercise = false;
    let rolledMidSession = false;

    for (let day = 0; day < DAYS; day++) {
      setDayOffset(day);
      // Abrir o app no dia (ou voltar do segundo plano).
      await useHunter.getState().refreshDay();
      let h = useHunter.getState();
      expect(h.quest?.date).toBe(h.today);

      // Penalidade aberta por falta de ontem: cumpre a Zona de Penalidade.
      if (h.penaltyOpenFor) {
        await h.clearPenalty();
        log.push({ day, kind: 'penalty_cleared' });
        expect(useHunter.getState().penaltyOpenFor).toBeNull();
      }

      h = useHunter.getState();
      const quest = h.quest!;

      if (quest.isRestDay) {
        await h.completeToday();
        log.push({ day, kind: 'rest' });
      } else if (!skippedOnce && day >= 8) {
        // Falta um dia de treino de propósito.
        skippedOnce = true;
        log.push({ day, kind: 'skipped' });
      } else if (!crashedMidExercise) {
        // App fechado NO MEIO de um exercício: o que foi tocado continua lá.
        crashedMidExercise = true;
        const first = quest.objectives[0];
        const half = Math.max(1, Math.floor(first.targetValue / 2));
        doReps(first.exerciseId, half);
        await restartApp();
        const resumed = useHunter.getState().quest!.objectives.find((o) => o.exerciseId === first.exerciseId)!;
        expect(resumed.actualValue).toBe(half);
        await trainFully();
        const c = await useHunter.getState().completeToday();
        xpPerSession.push(c!.xpGained);
        log.push({ day, kind: 'crash_resume' });
      } else if (!partialOnce && day >= 15) {
        // Dia parcial: metade do primeiro exercício e encerra o dia.
        partialOnce = true;
        const first = quest.objectives[0];
        doReps(first.exerciseId, Math.floor(first.targetValue / 2));
        await useHunter.getState().finishObjective(first.exerciseId, 7, true);
        const c = await useHunter.getState().completeToday();
        expect(useHunter.getState().quest!.status).toBe('partial');
        xpPerSession.push(c!.xpGained);
        log.push({ day, kind: 'partial' });
      } else if (!rolledMidSession && day >= 20) {
        // Treinando às 23:59: a meia-noite passa com a sessão aberta.
        rolledMidSession = true;
        h.setSessionActive(true);
        setDayOffset(day + 1);
        expect(await useHunter.getState().refreshDay()).toBe(false);
        expect(useHunter.getState().quest!.date).toBe(quest.date);
        await trainFully();
        const c = await useHunter.getState().completeToday();
        xpPerSession.push(c!.xpGained);
        useHunter.getState().setSessionActive(false);
        // A sessão conta para o dia em que começou.
        expect(useHunter.getState().events.some((e) => e.id === `session:${quest.date}`)).toBe(true);
        setDayOffset(day);
        log.push({ day, kind: 'midnight_session' });
      } else {
        await trainFully();
        const c = await useHunter.getState().completeToday();
        expect(useHunter.getState().quest!.status).toBe('completed');
        xpPerSession.push(c!.xpGained);
        log.push({ day, kind: 'trained' });
      }

      // Fecha e abre o app: o que a tela mostra volta idêntico.
      const before = visibleState();
      await restartApp();
      expect(visibleState()).toEqual(before);
    }

    // O roteiro passou por todos os casos.
    const kinds = new Set(log.map((l) => l.kind));
    for (const k of ['trained', 'rest', 'skipped', 'penalty_cleared', 'crash_resume', 'partial', 'midnight_session']) {
      expect(kinds.has(k), k).toBe(true);
    }
  });

  it('o histórico tem tudo: cada dia de treino virou exatamente uma sessão', async () => {
    const h = useHunter.getState();
    const sessions = h.events.filter((e) => e.kind === 'session_completed');
    const ids = h.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const trainedOrRest = log.filter((l) => l.kind !== 'skipped' && l.kind !== 'penalty_cleared').length;
    expect(sessions.length).toBe(trainedOrRest);

    // Missões de todos os dias estão gravadas (é o que o Lab mostra).
    const quests = await holder.repos.quests.between(h.startedAt!, h.today);
    expect(quests.length).toBe(DAYS);
  });

  it('a progressão faz sentido depois de cinco semanas', () => {
    const h = useHunter.getState();
    expect(h.progression.rank).toBe('E');
    expect(h.progression.level).toBeGreaterThan(1);
    // A falta zerou a sequência uma vez, mas a penalidade cumprida a restaurou.
    expect(h.progression.streakCurrent).toBeGreaterThan(0);
    // Nenhum atributo dispara: cinco semanas não fazem ninguém chegar a 100.
    // Nenhum atributo dispara. A Vitalidade mede a constância das últimas 4
    // semanas: 3 treinos por semana valem 60 por definição.
    const { VIT, ...rest } = h.progression.attributes;
    expect(VIT).toBeLessThanOrEqual(60);
    for (const v of Object.values(rest)) expect(v).toBeLessThan(30);
    // XP por sessão é estável (sem sessões "de 10 horas").
    for (const xp of xpPerSession) expect(xp).toBeLessThan(400);
    // O que está gravado refolda para o mesmo estado.
    expect(foldAll(h.events).progression).toEqual(h.progression);
  });

  it('pontos de atributo: gastar entra no log DEPOIS da sessão que os deu, e sobrevive a reabrir', async () => {
    const before = useHunter.getState().progression;
    expect(before.unspentPoints).toBeGreaterThan(0);
    const order = ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const;
    // O caso perigoso: treinou cedo e gastou o ponto às 8h (UTC), antes das
    // 12:00 UTC em que a sessão do dia fica gravada.
    const today = useHunter.getState().today;
    const realNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(`${today}T08:00:00.000Z`) - getDayOffset() * 86_400_000);
    try {
      await useHunter.getState().spendPoint(order[0]);
    } finally {
      vi.mocked(Date.now).mockRestore();
    }
    expect(Date.now).toBe(realNow);
    for (let i = 1; i < before.unspentPoints; i++) await useHunter.getState().spendPoint(order[i % 5]);
    const after = useHunter.getState().progression;
    expect(after.unspentPoints).toBe(0);
    const spent = Object.values(after.attributes).reduce((a, v) => a + v, 0)
      - Object.values(before.attributes).reduce((a, v) => a + v, 0);
    expect(spent).toBe(before.unspentPoints);
    // Nenhum gasto ficou antes da última sessão no log (o fold o descartaria).
    const events = useHunter.getState().events;
    const lastSession = events.filter((e) => e.kind === 'session_completed').at(-1)!;
    for (const e of events.filter((x) => x.kind === 'points_spent')) expect(e.at > lastSession.at).toBe(true);
    // Sem ponto, o botão não cria ponto.
    await useHunter.getState().spendPoint('STR');
    expect(useHunter.getState().progression).toEqual(after);
    await restartApp();
    expect(useHunter.getState().progression).toEqual(after);
  });

  it('estudar no Códice sobe Inteligência e extrai o Arauto, sem contar repetido', async () => {
    const int0 = useHunter.getState().progression.attributes.INT;
    for (const id of ['push_wall', 'squat_chair', 'plank_wall', 'push_wall']) {
      await useHunter.getState().markCodexRead(id);
    }
    const h = useHunter.getState();
    expect(h.events.filter((e) => e.kind === 'codex_read')).toHaveLength(3);
    expect(h.progression.attributes.INT).toBeGreaterThan(int0);
    expect(h.shadowProgress.arauto).toBe(1);
    // A sombra é extraída na próxima conclusão do dia.
    setDayOffset(DAYS);
    await useHunter.getState().refreshDay();
    if (useHunter.getState().penaltyOpenFor) await useHunter.getState().clearPenalty();
    if (!useHunter.getState().quest!.isRestDay) await trainFully();
    await useHunter.getState().completeToday();
    expect(useHunter.getState().unlockedShadows).toContain('arauto');
    await restartApp();
    expect(useHunter.getState().unlockedShadows).toContain('arauto');
  });

  it('celular quebrou: o backup restaura tudo num aparelho novo, nos dois caminhos', async () => {
    // Sobe para o Rank D antes, para provar que o restauro não derruba o rank.
    await useHunter.getState().submitBenchmark({ pushReps: 50, squatReps: 50, coreSeconds: 120, aerobicMinutes: 60 });
    expect(useHunter.getState().progression.rank).toBe('D');

    const original = holder.repos;
    const quests = await original.quests.between('1970-01-01', '9999-12-31');
    const file = serializeBundle(await buildBundle(original, new Date().toISOString(), quests));
    const reference = visibleState();
    const startedAt = useHunter.getState().startedAt;

    const freshDevice = async (name: string) => {
      driver.close();
      useHunter.setState(initialState, true);
      driver = createNodeDriver(join(dir, name));
      holder.repos = createSqliteRepositories(driver);
    };

    // O celular quebra alguns dias depois do último backup.
    const restoreDay = getDayOffset() + 5;

    // Caminho 1: "Já tenho um backup" na primeira tela, sem onboarding.
    setDayOffset(restoreDay);
    await freshDevice('phone-a.db');
    await restoreBundle(holder.repos, parseBundle(file));
    await useHunter.getState().boot();
    expect(useHunter.getState().startedAt).toBe(startedAt);
    // Histórico, rank, nível, sombras: tudo igual. (O dia é outro, então a
    // missão de hoje e a contagem de eventos do calendário mudam.)
    expect(useHunter.getState().progression.rank).toBe('D');
    expect(useHunter.getState().progression.level).toBe(reference.progression.level);
    expect(useHunter.getState().progression.xp).toBe(reference.progression.xp);
    expect(useHunter.getState().ladder).toEqual(reference.ladder);
    expect([...useHunter.getState().unlockedShadows].sort()).toEqual(reference.unlockedShadows);

    // Caminho 2: fez um onboarding novo HOJE e importou depois em Ajustes.
    await freshDevice('phone-b.db');
    useOnboarding.setState({ draft: { ...DEFAULT_DRAFT, hunterName: 'novo' }, parq: {} });
    await useOnboarding.getState().commit();
    await useHunter.getState().boot();
    expect(useHunter.getState().progression.rank).toBe('E');
    await restoreBundle(holder.repos, parseBundle(file));
    await useHunter.getState().boot();
    expect(useHunter.getState().startedAt).toBe(startedAt);
    expect(useHunter.getState().progression.rank).toBe('D');
    expect(useHunter.getState().progression.xp).toBe(reference.progression.xp);
    expect(useHunter.getState().ladder).toEqual(reference.ladder);
    expect(useHunter.getState().profile?.hunterName).toBe('TESTE');
  });

  it('a carga cresceu sem saltos', async () => {
    const h = useHunter.getState();
    const quests = (await holder.repos.quests.between(h.startedAt!, h.today))
      .filter((q) => !q.isRestDay && !q.isDeload);
    const byId = new Map(EXERCISES.map((e) => [e.id, e]));
    const load = (q: (typeof quests)[number]) => q.objectives
      .filter((o) => byId.get(o.exerciseId)!.pattern === 'squat')
      .reduce((a, o) => a + o.targetValue * byId.get(o.exerciseId)!.difficulty, 0);
    expect(load(quests.at(-1)!)).toBeGreaterThan(load(quests[0]));
  });
});
