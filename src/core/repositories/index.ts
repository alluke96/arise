import { createMockRepositories } from './mock';
import type { Repositories } from './types';

export * from './types';
export { createMockRepositories } from './mock';
export { createSqliteRepositories } from './sqlite';

/**
 * PONTO ÚNICO DE INJEÇÃO.
 *
 * `USE_SQLITE` liga a persistência real. Fica desligado enquanto as telas de
 * onboarding não populam o banco sozinhas — com ele ligado, o app abre vazio,
 * que é o comportamento correto para um usuário novo mas não para demonstrar.
 *
 * Nada além deste arquivo sabe qual implementação está ativa. Se uma tela
 * importar `createSqliteRepositories` direto, essa garantia se perde.
 */
export const USE_SQLITE = false;

function build(): Repositories {
  if (USE_SQLITE) {
    // Import tardio: `expo-sqlite` é módulo nativo e quebraria os testes em Node.
    const { createSqliteRepositories } = require('./sqlite') as typeof import('./sqlite');
    const { createExpoDriver } = require('../db/driver.expo') as typeof import('../db/driver.expo');
    return createSqliteRepositories(createExpoDriver());
  }
  const { DEMO_PAIN_LOG, DEMO_PROFILE, DEMO_PROGRESSION, DEMO_SCREENING, DEMO_SESSIONS } =
    require('../../data/mocks/demo') as typeof import('../../data/mocks/demo');
  return createMockRepositories({
    profile: DEMO_PROFILE,
    progression: DEMO_PROGRESSION,
    screening: DEMO_SCREENING,
    sessions: DEMO_SESSIONS,
    pain: DEMO_PAIN_LOG,
  });
}

export const repositories: Repositories = build();
