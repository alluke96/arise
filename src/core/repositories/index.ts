import { createMockRepositories } from './mock';
import type { Repositories } from './types';

export * from './types';

/**
 * PONTO ÚNICO DE INJEÇÃO.
 *
 * Fase 1: mock em memória. Fase 2 (tarefa 23): trocar por
 * `createSqliteRepositories()`. Nenhuma tela e nenhuma função do motor
 * muda — se alguma delas importar SQLite direto, essa garantia se perde.
 */
export const repositories: Repositories = createMockRepositories();
