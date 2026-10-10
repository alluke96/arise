import type { SqlDriver, SqlValue } from './driver';

/**
 * Driver da WEB (o app instalado na Tela de Início do iPhone).
 *
 * Nome `.wasm.ts`, não `.web.ts`: com `.web` o Metro trataria este arquivo
 * como a versão web de `driver.ts` e esconderia os helpers de lá (json, bool).
 *
 * Mesmo SQL do aparelho, rodando no SQLite oficial compilado para
 * WebAssembly (sql.js). O sql.js guarda o banco em memória; a durabilidade
 * vem de gravar o ARQUIVO inteiro do banco no IndexedDB depois de cada
 * escrita. O banco do Arise tem poucos KB, então exportar a cada toque custa
 * menos de um milissegundo.
 *
 * O sql.js é carregado por <script> a partir de `/vendor` (copiado no build
 * web e guardado pelo service worker), e não pelo bundler: o pacote tem
 * ramos de Node que o Metro tentaria resolver.
 */
const IDB_NAME = 'arise';
const IDB_STORE = 'files';
const IDB_KEY = 'arise.db';

interface SqlJsStatement {
  bind(params: SqlValue[]): void;
  step(): boolean;
  getAsObject(): Record<string, SqlValue>;
  free(): void;
}
interface SqlJsDatabase {
  run(sql: string, params?: SqlValue[]): void;
  exec(sql: string): unknown;
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
  close(): void;
}
interface SqlJsStatic { Database: new (data?: Uint8Array) => SqlJsDatabase }
type InitSqlJs = (config: { locateFile: (file: string) => string }) => Promise<SqlJsStatic>;

function base(): string {
  return (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`não carregou ${src}`));
    document.head.appendChild(el);
  });
}

function openIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function idbGet(idb: IDBDatabase): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const req = idb.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result ? new Uint8Array(req.result as ArrayBuffer) : null);
    req.onerror = () => resolve(null);
  });
}

function idbPut(idb: IDBDatabase, bytes: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    // Cópia: o buffer do sql.js é reaproveitado na próxima exportação.
    tx.objectStore(IDB_STORE).put(bytes.slice().buffer, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Estado da persistência, para a tela de Ajustes avisar se algo falhar. */
export const webStorageStatus = { persistent: false, durable: false, lastError: null as string | null };

export async function createWebDriver(): Promise<SqlDriver> {
  const w = window as unknown as { initSqlJs?: InitSqlJs };
  if (!w.initSqlJs) await loadScript(`${base()}/vendor/sql-wasm.js`);
  const SQL = await w.initSqlJs!({ locateFile: (file) => `${base()}/vendor/${file}` });

  const idb = await openIdb();
  webStorageStatus.durable = idb !== null;
  // Pede ao navegador para não apagar os dados sob pressão de espaço.
  try { webStorageStatus.persistent = (await navigator.storage?.persist?.()) ?? false; } catch { /* opcional */ }

  const saved = idb ? await idbGet(idb) : null;
  const db = new SQL.Database(saved ?? undefined);
  db.exec('pragma foreign_keys = on');

  // Gravação: cada escrita marca o banco como sujo; no fim da tarefa atual o
  // arquivo inteiro vai para o IndexedDB (várias escritas seguidas viram uma).
  let dirty = false;
  let scheduled = false;
  let chain: Promise<void> = Promise.resolve();
  const flush = () => {
    scheduled = false;
    if (!dirty || !idb) return;
    dirty = false;
    const bytes = db.export();
    // `export()` fecha e reabre o banco: os pragmas voltam ao padrão.
    db.exec('pragma foreign_keys = on');
    chain = chain.then(() => idbPut(idb, bytes)).catch((e: unknown) => {
      webStorageStatus.lastError = e instanceof Error ? e.message : String(e);
      dirty = true;
    });
  };
  const touched = () => {
    dirty = true;
    if (!scheduled) { scheduled = true; queueMicrotask(flush); }
  };
  // Garantia extra ao sair do app ou mandá-lo para o segundo plano.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    window.addEventListener('pagehide', flush);
  }

  let inTransaction = false;
  const query = <T>(sql: string, params: SqlValue[]): T[] => {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  };

  return {
    exec: (sql) => { db.exec(sql); touched(); },
    run: (sql, params = []) => { db.run(sql, params); if (!inTransaction) touched(); },
    all: <T>(sql: string, params: SqlValue[] = []) => query<T>(sql, params),
    get: <T>(sql: string, params: SqlValue[] = []) => query<T>(sql, params)[0],
    transaction(fn) {
      db.exec('begin');
      inTransaction = true;
      try {
        fn();
        db.exec('commit');
      } catch (e) {
        db.exec('rollback');
        throw e;
      } finally {
        inTransaction = false;
      }
      touched();
    },
    close: () => { flush(); db.close(); },
  };
}
