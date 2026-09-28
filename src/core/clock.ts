/**
 * Relógio do app.
 *
 * Tudo que depende de "hoje" passa por aqui. No uso normal é o relógio do
 * aparelho; no build de teste dá para adiantar dias e ver a progressão
 * andar sem esperar semanas de verdade.
 */
const DAY = 86_400_000;
let offsetDays = 0;

export function setDayOffset(days: number): void {
  offsetDays = Math.max(0, Math.round(days));
}

export function getDayOffset(): number {
  return offsetDays;
}

export function nowMs(): number {
  return Date.now() + offsetDays * DAY;
}

export function nowISO(): string {
  return new Date(nowMs()).toISOString();
}

/** Data LOCAL de hoje (YYYY-MM-DD), já com o deslocamento aplicado. */
export function todayLocal(): string {
  const d = new Date(nowMs());
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Tempo restante como HH:MM:SS.mmm. Horas passam de 99 sem quebrar; negativo vira zero. */
export function formatCountdown(ms: number): string {
  const t = Math.max(0, Math.floor(ms));
  const h = Math.floor(t / 3600_000);
  const m = Math.floor((t % 3600_000) / 60_000);
  const s = Math.floor((t % 60_000) / 1000);
  const milli = t % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(s)}.${p(milli, 3)}`;
}
