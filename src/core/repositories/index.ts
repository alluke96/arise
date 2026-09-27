import { createMockRepositories } from './mock';
import type { Repositories } from './types';

export * from './types';
export { createMockRepositories } from './mock';
export { createSqliteRepositories } from './sqlite';

/**
 * PONTO ÚNICO DE INJEÇÃO.
 *
 * Padrão: SQLite — o app de verdade, que começa vazio e passa pelo
 * onboarding. `EXPO_PUBLIC_DEMO=1` troca pelo caçador de demonstração em
 * memória, para mostrar o app sem precisar treinar sete semanas antes.
 *
 * Nada além deste arquivo sabe qual implementação está ativa.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === '1';

function build(): Repositories {
  if (!DEMO_MODE) {
    // Import tardio: `expo-sqlite` é módulo nativo e quebraria os testes em Node.
    const { createSqliteRepositories } = require('./sqlite') as typeof import('./sqlite');
    const { createExpoDriver } = require('../db/driver.expo') as typeof import('../db/driver.expo');
    return createSqliteRepositories(createExpoDriver());
  }
  const { buildDemo } = require('../../data/mocks/demo') as typeof import('../../data/mocks/demo');
  const demo = buildDemo();
  return createMockRepositories({
    profile: demo.profile,
    screening: demo.screening,
    startedAt: demo.startedAt,
    events: demo.events,
    quests: demo.quests,
    onboarded: true,
  });
}

export const repositories: Repositories = build();
