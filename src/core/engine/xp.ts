import type { Progression, SessionSummary, RpeBand } from '../types';

export const POINTS_PER_LEVEL = 3;

/** XP necessário para alcançar o nível N. Curva desacelera de propósito:
 *  a densidade de recompensa fica nas primeiras semanas, que é quando o
 *  sedentário desiste. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.45));
}

const INTENSITY: Record<RpeBand, number> = { 3: 0.8, 5: 1.0, 7: 1.2, 9: 1.3 };
const COMPLETION = { partial: 0.5, complete: 1.0, complete_good_form: 1.15 } as const;

export function calcXp(
  session: SessionSummary,
  streakDays: number,
  isFirstOfDay = true,
): number {
  const base = session.durationMin * 2;
  const gross = base * INTENSITY[session.avgRpe] * COMPLETION[session.completion];
  const streakBonus = Math.min(streakDays * 2, 50);
  return Math.round(gross + streakBonus + (isFirstOfDay ? 20 : 0));
}

/** R6.4: o nível NUNCA decresce. Esta função não tem caminho que o reduza. */
export function applyXp(prog: Progression, gainedXp: number): Progression {
  const xp = prog.xp + Math.max(0, gainedXp);
  let level = prog.level;
  while (xp >= xpForLevel(level + 1)) level += 1;

  const levelsGained = level - prog.level;
  return {
    ...prog,
    xp,
    level,
    unspentPoints: prog.unspentPoints + levelsGained * POINTS_PER_LEVEL,
  };
}

/** Progresso dentro do nível atual, de 0 a 1. Para a barra de XP. */
export function levelProgress(prog: Progression): {
  current: number;
  needed: number;
  ratio: number;
} {
  const floor = xpForLevel(prog.level);
  const ceil = xpForLevel(prog.level + 1);
  const current = prog.xp - floor;
  const needed = ceil - floor;
  return { current, needed, ratio: needed > 0 ? current / needed : 0 };
}
