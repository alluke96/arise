import { createExpoDriver } from '../db/driver.expo';
import { createSqliteRepositories } from './sqlite';
import type { Repositories } from './types';

/** Celular nativo: `expo-sqlite`, gravação síncrona em disco (WAL). */
export async function createPlatformRepositories(): Promise<Repositories> {
  return createSqliteRepositories(createExpoDriver());
}
