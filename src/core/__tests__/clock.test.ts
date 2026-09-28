import { afterEach, describe, expect, it } from 'vitest';
import { formatCountdown, getDayOffset, nowMs, setDayOffset, todayLocal } from '../clock';

afterEach(() => setDayOffset(0));

describe('relógio do app', () => {
  it('formata o prazo com segundos e milissegundos', () => {
    expect(formatCountdown(0)).toBe('00:00:00.000');
    expect(formatCountdown(4 * 3600_000 + 5 * 60_000 + 7_000 + 42)).toBe('04:05:07.042');
    expect(formatCountdown(-500)).toBe('00:00:00.000');
    expect(formatCountdown(123 * 3600_000)).toBe('123:00:00.000');
  });

  it('adiantar dias move "hoje" e o instante atual', () => {
    const before = nowMs();
    setDayOffset(3);
    expect(getDayOffset()).toBe(3);
    expect(nowMs() - before).toBeGreaterThanOrEqual(3 * 86_400_000);
    expect(todayLocal() > new Date(before).toISOString().slice(0, 10)).toBe(true);
  });

  it('o relógio nunca volta para trás', () => {
    setDayOffset(-5);
    expect(getDayOffset()).toBe(0);
  });
});
