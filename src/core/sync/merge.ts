/**
 * Resolução de conflito para DOCUMENTOS mutáveis — perfil, triagem, missão do
 * dia. Última escrita vence (B2.6).
 *
 * Eventos não passam por aqui: eles não conflitam, eles se unem.
 */
export interface Versioned {
  updatedAt: string;
  updatedByDevice: string;
}

/**
 * LWW por `updatedAt`, com desempate determinístico por `updatedByDevice`
 * (B2.7).
 *
 * O desempate não é detalhe: sem ele, duas escritas no mesmo milissegundo
 * fariam cada aparelho manter a sua, e os dois divergiriam para sempre sem
 * nunca detectar conflito. Comparar o id do aparelho garante que ambos
 * escolhem o MESMO vencedor.
 */
export function mergeDocument<T extends Versioned>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  if (a.updatedByDevice === b.updatedByDevice) return a;
  return a.updatedByDevice > b.updatedByDevice ? a : b;
}

/** Une duas coleções de documentos por chave, resolvendo cada colisão por LWW. */
export function mergeCollections<T extends Versioned>(
  local: T[], remote: T[], keyOf: (doc: T) => string,
): T[] {
  const byKey = new Map<string, T>();
  for (const doc of local) byKey.set(keyOf(doc), doc);
  for (const doc of remote) {
    const key = keyOf(doc);
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeDocument(existing, doc) : doc);
  }
  return [...byKey.values()].sort((x, y) => (keyOf(x) < keyOf(y) ? -1 : 1));
}
