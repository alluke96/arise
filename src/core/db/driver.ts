/**
 * Interface mínima de driver SQL.
 *
 * Existe por uma razão específica: permitir que o MESMO código de repositório
 * rode contra `expo-sqlite` no aparelho e contra `node:sqlite` nos testes.
 * Sem isso, a camada que guarda meses de treino de alguém só seria exercitada
 * em device — e passaria a ser a parte menos testada do app.
 *
 * Optamos por SQL puro em vez de Drizzle justamente por isto: o driver do
 * Drizzle para Expo depende do módulo nativo e não roda em Node, o que
 * custaria a testabilidade do repositório. Ver `.kiro/steering/tech.md`.
 */
export interface SqlDriver {
  exec(sql: string): void;
  run(sql: string, params?: SqlValue[]): void;
  all<T = Record<string, SqlValue>>(sql: string, params?: SqlValue[]): T[];
  get<T = Record<string, SqlValue>>(sql: string, params?: SqlValue[]): T | undefined;
  transaction(fn: () => void): void;
  close(): void;
}

export type SqlValue = string | number | null;

/** Booleans viram inteiros: SQLite não tem tipo booleano. */
export const bool = (v: boolean | null | undefined): number | null =>
  v === null || v === undefined ? null : v ? 1 : 0;

export const unbool = (v: SqlValue): boolean | null =>
  v === null || v === undefined ? null : v === 1;

export const json = (v: unknown): string => JSON.stringify(v);

export function unjson<T>(v: SqlValue, fallback: T): T {
  if (typeof v !== 'string') return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
