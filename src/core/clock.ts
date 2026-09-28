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
