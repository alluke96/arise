import { describe, expect, it } from 'vitest';
import {
  BASE_BACKOFF_MS, INITIAL_STATUS, MAX_BACKOFF_MS, MAX_BATCH, backoffMs,
  nextBatch, onEnqueue, onFailure, onSuccess, shouldAttempt, statusLabel,
} from '../queue';
import type { DomainEvent } from '../events';

const NOW = '2026-09-21T12:00:00.000Z';
const later = (ms: number) => new Date(Date.parse(NOW) + ms).toISOString();

const events = (n: number): DomainEvent[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `e${i}`, at: NOW, deviceId: 'd', kind: 'penalty_completed' as const,
  }));

describe('recuo exponencial', () => {
  it('cresce a cada falha', () => {
    expect(backoffMs(1)).toBe(BASE_BACKOFF_MS);
    expect(backoffMs(2)).toBe(BASE_BACKOFF_MS * 2);
    expect(backoffMs(3)).toBe(BASE_BACKOFF_MS * 4);
  });

  it('tem teto — servidor fora do ar não vira tempestade nem fila parada', () => {
    for (let n = 1; n < 40; n++) expect(backoffMs(n)).toBeLessThanOrEqual(MAX_BACKOFF_MS);
    expect(backoffMs(30)).toBe(MAX_BACKOFF_MS);
  });

  it('sem falhas não há espera', () => {
    expect(backoffMs(0)).toBe(0);
  });
});

describe('lotes', () => {
  it('respeita o limite', () => {
    expect(nextBatch(events(500))).toHaveLength(MAX_BATCH);
  });
  it('envia tudo quando cabe', () => {
    expect(nextBatch(events(5))).toHaveLength(5);
  });
});

describe('máquina de estado da fila', () => {
  it('enfileirar marca pendência', () => {
    const s = onEnqueue(INITIAL_STATUS, 3);
    expect(s.state).toBe('pending');
    expect(s.pendingEvents).toBe(3);
  });

  it('sucesso avança o cursor e zera as falhas', () => {
    const s = onSuccess(onEnqueue(INITIAL_STATUS, 3), 3, NOW);
    expect(s.state).toBe('idle');
    expect(s.pendingEvents).toBe(0);
    expect(s.lastSyncedAt).toBe(NOW);
    expect(s.consecutiveFailures).toBe(0);
  });

  it('sucesso parcial mantém o resto pendente', () => {
    const s = onSuccess(onEnqueue(INITIAL_STATUS, 10), 4, NOW);
    expect(s.pendingEvents).toBe(6);
    expect(s.state).toBe('pending');
  });

  /** B3.8 — o evento local nunca é perdido por falha de sincronização. */
  it('falhar não descarta nada da fila', () => {
    const queued = onEnqueue(INITIAL_STATUS, 7);
    let s = queued;
    for (let i = 0; i < 10; i++) s = onFailure(s, NOW);
    expect(s.pendingEvents).toBe(7);
  });

  it('falha agenda a próxima tentativa com recuo', () => {
    const s = onFailure(onEnqueue(INITIAL_STATUS, 1), NOW);
    expect(s.state).toBe('error');
    expect(s.nextAttemptAt).toBe(later(BASE_BACKOFF_MS));
  });

  it('não tenta antes da hora marcada', () => {
    const s = onFailure(onEnqueue(INITIAL_STATUS, 1), NOW);
    expect(shouldAttempt(s, later(BASE_BACKOFF_MS - 1))).toBe(false);
    expect(shouldAttempt(s, later(BASE_BACKOFF_MS))).toBe(true);
  });

  it('não tenta com a fila vazia e sem erro', () => {
    expect(shouldAttempt(INITIAL_STATUS, NOW)).toBe(false);
  });

  it('nunca tenta duas vezes em paralelo', () => {
    expect(shouldAttempt({ ...INITIAL_STATUS, state: 'syncing', pendingEvents: 5 }, NOW)).toBe(false);
  });

  it('um sucesso depois de falhas reabilita a tentativa imediata', () => {
    let s = onFailure(onEnqueue(INITIAL_STATUS, 5), NOW);
    s = onSuccess(s, 5, NOW);
    expect(s.nextAttemptAt).toBeNull();
    expect(s.consecutiveFailures).toBe(0);
  });
});

describe('indicador em Configurações (B3.7)', () => {
  it.each([
    [INITIAL_STATUS, 'synced'],
    [onEnqueue(INITIAL_STATUS, 2), 'pending'],
    [{ ...INITIAL_STATUS, state: 'syncing' as const }, 'syncing'],
    [onFailure(onEnqueue(INITIAL_STATUS, 1), NOW), 'error'],
  ])('reflete o estado real', (status, expected) => {
    expect(statusLabel(status)).toBe(expected);
  });
});
