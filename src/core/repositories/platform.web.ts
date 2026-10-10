import { createWebDriver } from '../db/driver.wasm';
import { createSqliteRepositories } from './sqlite';
import type { Repositories } from './types';

/** Web / PWA: SQLite em WebAssembly, persistido no IndexedDB. */
export async function createPlatformRepositories(): Promise<Repositories> {
  return createSqliteRepositories(await createWebDriver());
}
