import { normalizeEvents, type DomainEvent } from '../sync/events';
import type { Exercise, Pattern, Rank, UserProfile } from '../types';
import { rankAtLeast } from './rank';

/** Padrões que exigem par de ilustrações para serem prescritos (R11.3/R11.4). */
export const LOAD_PATTERNS: Pattern[] = [
  'push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge',
  'unilateral', 'core_anti_ext', 'core_anti_rot', 'trunk_flex',
];

export function isPrescribable(ex: Exercise): boolean {
  if (!LOAD_PATTERNS.includes(ex.pattern)) return true;
  return ex.illustrations !== null;
}

/** Duas sessões seguidas com o alvo cumprido e boa forma → próximo degrau (§3.4). */
export const ADVANCE_AFTER = 2;

/**
 * Degraus que ESTE usuário pode fazer num padrão: prescritíveis, com o
 * equipamento que ele tem e sem contraindicação. Do mais fácil ao mais difícil.
 */
export function eligibleRungs(
  catalog: Exercise[], pattern: Pattern,
  profile: Pick<UserProfile, 'equipment' | 'limitations'>,
): Exercise[] {
  return catalog
    .filter((e) => e.pattern === pattern)
    .filter(isPrescribable)
    .filter((e) => e.equipment.some((eq) => profile.equipment.includes(eq)))
    .filter((e) => !e.contraindications.some((c) => profile.limitations.includes(c)))
    .sort((a, b) => a.difficulty - b.difficulty);
}

/** Degrau mais alto permitido pelo rank. -1 se nenhum. */
export function capIndex(rungs: Exercise[], rank: Rank): number {
  let cap = -1;
  rungs.forEach((e, i) => { if (rankAtLeast(rank, e.minRank)) cap = i; });
  return cap;
}

/**
 * Degrau de ENTRADA de um rank: o mais fácil daquele rank.
 *
 * Quem acabou de chegar ao Rank D começa pelo primeiro degrau do D, não pelo
 * mais difícil que o rank permite — negativas de flexão para quem ainda não
 * fecha a flexão de joelhos seriam permitidas, e cedo demais.
 */
export function entryIndex(rungs: Exercise[], rank: Rank): number {
  const atRank = rungs.findIndex((e) => e.minRank === rank);
  return atRank >= 0 ? atRank : capIndex(rungs, rank);
}

interface RungState {
  index: number;
  good: number;
  touched: boolean;
}

export interface LadderPosition {
  exerciseId: string;
  /** Sessões boas seguidas no degrau atual (0..ADVANCE_AFTER-1). */
  streak: number;
  canGoHarder: boolean;
  canGoEasier: boolean;
}

/**
 * Posição na escada de cada padrão, derivada do log de eventos.
 *
 * Mesmo modelo da progressão: nada é armazenado, tudo é fold. Dois aparelhos
 * com os mesmos eventos chegam ao mesmo degrau.
 */
export function foldLadder(
  events: DomainEvent[],
  catalog: Exercise[],
  profile: Pick<UserProfile, 'equipment' | 'limitations'>,
): Partial<Record<Pattern, LadderPosition>> {
  const patterns = [...new Set(catalog.map((e) => e.pattern))];
  const rungs = new Map(patterns.map((p) => [p, eligibleRungs(catalog, p, profile)]));
  const patternOf = new Map(catalog.map((e) => [e.id, e.pattern]));

  let rank: Rank = 'E';
  const state = new Map<Pattern, RungState>();
  for (const p of patterns) {
    state.set(p, { index: entryIndex(rungs.get(p)!, rank), good: 0, touched: false });
  }

  const moveTo = (p: Pattern, exerciseId: string): RungState | undefined => {
    const list = rungs.get(p)!;
    const s = state.get(p)!;
    const i = list.findIndex((e) => e.id === exerciseId);
    if (i < 0) return undefined;
    if (i !== s.index) { s.index = i; s.good = 0; }
    s.touched = true;
    return s;
  };

  for (const e of normalizeEvents(events)) {
    if (e.kind === 'benchmark_passed') {
      rank = e.rankAfter;
      // Padrões que o usuário ainda não tocou entram pelo degrau do rank novo.
      for (const p of patterns) {
        const s = state.get(p)!;
        if (!s.touched) s.index = entryIndex(rungs.get(p)!, rank);
      }
    } else if (e.kind === 'session_completed' && e.session.results) {
      for (const r of e.session.results) {
        const p = patternOf.get(r.exerciseId);
        if (!p) continue;
        const s = moveTo(p, r.exerciseId);
        if (!s) continue;
        if (r.completed && r.formOk) {
          s.good += 1;
          const cap = capIndex(rungs.get(p)!, rank);
          if (s.good >= ADVANCE_AFTER && s.index < cap) {
            s.index += 1;
            s.good = 0;
          }
        } else {
          s.good = 0;
        }
      }
    } else if (e.kind === 'exercise_adjusted') {
      const list = rungs.get(e.pattern);
      const s = state.get(e.pattern);
      if (!list || !s) continue;
      const i = list.findIndex((x) => x.id === e.toId);
      if (i < 0) continue;
      const cap = capIndex(list, rank);
      s.index = e.direction === 'harder' ? Math.min(i, Math.max(cap, 0)) : i;
      s.good = 0;
      s.touched = true;
    }
  }

  const out: Partial<Record<Pattern, LadderPosition>> = {};
  for (const p of patterns) {
    const list = rungs.get(p)!;
    if (list.length === 0) continue;
    const s = state.get(p)!;
    const cap = capIndex(list, rank);
    if (cap < 0) continue;
    const index = Math.min(Math.max(s.index, 0), cap);
    out[p] = {
      exerciseId: list[index].id,
      streak: s.good,
      canGoHarder: index < cap,
      canGoEasier: index > 0,
    };
  }
  return out;
}

/** Degrau vizinho, para os botões "Muito difícil" / "Muito fácil". */
export function neighborRung(
  catalog: Exercise[], exerciseId: string, direction: 'easier' | 'harder',
  profile: Pick<UserProfile, 'equipment' | 'limitations'>, rank: Rank,
): Exercise | null {
  const ex = catalog.find((e) => e.id === exerciseId);
  if (!ex) return null;
  const list = eligibleRungs(catalog, ex.pattern, profile);
  const i = list.findIndex((e) => e.id === exerciseId);
  if (i < 0) return null;
  if (direction === 'easier') return i > 0 ? list[i - 1] : null;
  const cap = capIndex(list, rank);
  return i < cap ? list[i + 1] : null;
}
