import type { DomainEvent } from './events';

/**
 * Fila de envio — B3.3, B3.5, B3.6, B3.8.
 *
 * Lógica pura: decide O QUE enviar e QUANDO tentar de novo. Não fala rede.
 * O cursor só avança com confirmação do servidor, então morrer no meio de um
 * lote reenvia — e o reenvio é no-op, porque o id do evento vem do cliente.
 */
export const MAX_BATCH = 200;
export const BASE_BACKOFF_MS = 2000;
export const MAX_BACKOFF_MS = 5 * 60_000;

export type SyncState = 'idle' | 'pending' | 'syncing' | 'error';

export interface SyncStatus {
  state: SyncState;
  pendingEvents: number;
  lastSyncedAt: string | null;
  consecutiveFailures: number;
  nextAttemptAt: string | null;
}

export const INITIAL_STATUS: SyncStatus = {
  state: 'idle', pendingEvents: 0, lastSyncedAt: null,
  consecutiveFailures: 0, nextAttemptAt: null,
};

/**
 * Recuo exponencial com teto. Um servidor fora do ar não deve virar uma
 * tempestade de requisições, nem deixar a fila parada para sempre.
 */
export function backoffMs(consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return 0;
  return Math.min(BASE_BACKOFF_MS * 2 ** (consecutiveFailures - 1), MAX_BACKOFF_MS);
}

export function nextBatch(pending: DomainEvent[], limit = MAX_BATCH): DomainEvent[] {
  return pending.slice(0, limit);
}

export function shouldAttempt(status: SyncStatus, now: string): boolean {
  if (status.state === 'syncing') return false;
  if (status.pendingEvents === 0 && status.state !== 'error') return false;
  if (!status.nextAttemptAt) return true;
  return Date.parse(now) >= Date.parse(status.nextAttemptAt);
}

export function onSuccess(status: SyncStatus, sent: number, now: string): SyncStatus {
  const pending = Math.max(0, status.pendingEvents - sent);
  return {
    state: pending > 0 ? 'pending' : 'idle',
    pendingEvents: pending,
    lastSyncedAt: now,
    consecutiveFailures: 0,
    nextAttemptAt: null,
  };
}

/** B3.8 — falhar NUNCA descarta evento: a fila sobrevive intacta. */
export function onFailure(status: SyncStatus, now: string): SyncStatus {
  const failures = status.consecutiveFailures + 1;
  return {
    ...status,
    state: 'error',
    consecutiveFailures: failures,
    nextAttemptAt: new Date(Date.parse(now) + backoffMs(failures)).toISOString(),
  };
}

export function onEnqueue(status: SyncStatus, count: number): SyncStatus {
  return {
    ...status,
    pendingEvents: status.pendingEvents + count,
    state: status.state === 'error' ? 'error' : 'pending',
  };
}

/** Texto para o indicador em Configurações (B3.7). */
export function statusLabel(status: SyncStatus): 'synced' | 'pending' | 'syncing' | 'error' {
  if (status.state === 'syncing') return 'syncing';
  if (status.state === 'error') return 'error';
  return status.pendingEvents > 0 ? 'pending' : 'synced';
}
