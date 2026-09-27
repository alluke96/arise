import { DatabaseSync } from 'node:sqlite';
import type { SqlDriver, SqlValue } from './driver';

/** Driver de teste. Roda o mesmo SQL que o aparelho roda, contra SQLite real. */
export function createNodeDriver(path = ':memory:'): SqlDriver {
  const db = new DatabaseSync(path);
  db.exec('pragma foreign_keys = on');

  return {
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => { db.prepare(sql).run(...params); },
    all: <T>(sql: string, params: SqlValue[] = []) => db.prepare(sql).all(...params) as T[],
    get: <T>(sql: string, params: SqlValue[] = []) => db.prepare(sql).get(...params) as T | undefined,
    transaction(fn) {
      db.exec('begin');
      try {
        fn();
        db.exec('commit');
      } catch (e) {
        db.exec('rollback');
        throw e;
      }
    },
    close: () => db.close(),
  };
}
