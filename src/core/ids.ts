/**
 * Geração de identificador.
 *
 * Os ids de evento nascem no CLIENTE — é o que torna o reenvio de um lote
 * idempotente no servidor (`on conflict do nothing`). Por isso precisam ser
 * únicos entre aparelhos, mas não precisam ser imprevisíveis: não são segredo.
 *
 * O gerador é injetável para que o app use `expo-crypto` e os testes usem o
 * `crypto` nativo do Node, sem que nenhum dos dois importe o outro.
 */
type Generator = () => string;

let generate: Generator = () => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback: suficiente para unicidade, não para segredo.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

export function setIdGenerator(fn: Generator): void {
  generate = fn;
}

export function newId(): string {
  return generate();
}

let deviceId: string | null = null;

/** Identifica este aparelho no desempate determinístico do LWW (B2.7). */
export function getDeviceId(): string {
  if (!deviceId) deviceId = newId();
  return deviceId;
}

export function setDeviceId(id: string): void {
  deviceId = id;
}
