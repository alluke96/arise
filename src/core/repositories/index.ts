import { createMockRepositories } from './mock';
import { createPlatformRepositories } from './platform';
import type { Repositories } from './types';

export * from './types';
export { createMockRepositories } from './mock';
export { createSqliteRepositories } from './sqlite';

/**
 * PONTO ÚNICO DE INJEÇÃO.
 *
 * Padrão: SQLite — o app de verdade, que começa vazio e passa pelo
 * onboarding. No celular nativo é o `expo-sqlite`; na web (o app instalado
 * na Tela de Início do iPhone) é o mesmo SQLite compilado para WebAssembly,
 * gravando no armazenamento do navegador. Ver `platform.ts` / `platform.web.ts`.
 *
 * `EXPO_PUBLIC_DEMO=1` troca pelo caçador de demonstração em memória.
 *
 * A abertura é ASSÍNCRONA (na web o banco vem do IndexedDB): o boot chama
 * `initRepositories()` antes de qualquer leitura. Nada além deste arquivo sabe
 * qual implementação está ativa.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === '1';

let instance: Repositories | null = null;

function buildDemo(): Repositories {
  const { buildDemo: demo } = require('../../data/mocks/demo') as typeof import('../../data/mocks/demo');
  const d = demo();
  return createMockRepositories({
    profile: d.profile, screening: d.screening, startedAt: d.startedAt,
    events: d.events, quests: d.quests, onboarded: true,
  });
}

/** Abre o banco. Idempotente; o boot do app chama antes de tudo. */
export async function initRepositories(): Promise<void> {
  if (instance) return;
  instance = DEMO_MODE ? buildDemo() : await createPlatformRepositories();
}

/**
 * As stores guardam esta referência; o proxy encaminha para a instância
 * aberta. Usar antes de `initRepositories()` é bug de ordem de boot, e falha
 * alto em vez de gravar num banco errado.
 */
export const repositories: Repositories = new Proxy({} as Repositories, {
  get(_target, key) {
    if (!instance) throw new Error(`repositories.${String(key)} usado antes de initRepositories()`);
    return instance[key as keyof Repositories];
  },
});
