import * as SQLite from 'expo-sqlite';
import type { SqlDriver, SqlValue } from './driver';

/** Driver do aparelho. Mesma interface, mesmo SQL do driver de teste. */
export function createExpoDriver(name = 'arise.db'): SqlDriver {
  const db = SQLite.openDatabaseSync(name);
  db.execSync('pragma foreign_keys = on');
  db.execSync('pragma journal_mode = WAL');

  return {
    exec: (sql) => db.execSync(sql),
    run: (sql, params = []) => { db.runSync(sql, params); },
    all: <T>(sql: string, params: SqlValue[] = []) => db.getAllSync(sql, params) as T[],
    get: <T>(sql: string, params: SqlValue[] = []) =>
      (db.getFirstSync(sql, params) as T | null) ?? undefined,
    transaction(fn) { db.withTransactionSync(fn); },
    close: () => db.closeSync(),
  };
}
