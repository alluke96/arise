/**
 * Roteiro da abertura ("Sinal detectado").
 *
 * Cada linha do terminal "pensa" antes de aparecer: as reticências surgem uma
 * a uma ("." → ".." → "..."), apagam, e isso repete CICLOS vezes; só então a
 * linha se completa e a próxima começa. Puro e testável — a tela só toca os
 * passos no tempo.
 */
export const INTRO_DOT_MS = 170;
export const INTRO_CYCLES = 3;
/** Respiro depois de cada linha completa. */
export const INTRO_LINE_PAUSE_MS = 260;
export const INTRO_WORDMARK_FADE_MS = 1800;
export const INTRO_ACTIONS_FADE_MS = 800;

export type Dots = 0 | 1 | 2 | 3;

export interface ThinkingStep {
  line: number;
  dots: Dots;
}

/** Passos de "pensamento" de todas as linhas, em ordem. */
export function thinkingSteps(lines: number, cycles = INTRO_CYCLES): ThinkingStep[] {
  const out: ThinkingStep[] = [];
  for (let line = 0; line < lines; line++) {
    for (let c = 0; c < cycles; c++) {
      for (const dots of [1, 2, 3, 0] as const) out.push({ line, dots });
    }
  }
  return out;
}

/** Duração total até a última linha aparecer (antes dos fades). */
export function terminalDurationMs(lines: number, cycles = INTRO_CYCLES): number {
  return lines * (cycles * 4 * INTRO_DOT_MS + INTRO_LINE_PAUSE_MS);
}
