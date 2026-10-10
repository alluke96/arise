import { describe, expect, it } from 'vitest';
import { INTRO_CYCLES, terminalDurationMs, thinkingSteps } from '../intro';

describe('abertura: cada linha pensa antes de aparecer', () => {
  const steps = thinkingSteps(4);

  it('reticências uma de cada vez, apaga, e repete 3 vezes por linha', () => {
    const first = steps.filter((s) => s.line === 0).map((s) => s.dots);
    expect(first).toEqual([1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]);
    expect(INTRO_CYCLES).toBe(3);
  });

  it('as linhas vêm em ordem, uma só depois da anterior terminar', () => {
    const lines = steps.map((s) => s.line);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
    expect(new Set(lines)).toEqual(new Set([0, 1, 2, 3]));
  });

  it('o terminal inteiro leva entre 6 e 12 segundos', () => {
    const ms = terminalDurationMs(4);
    expect(ms).toBeGreaterThan(6000);
    expect(ms).toBeLessThan(12000);
  });
});
