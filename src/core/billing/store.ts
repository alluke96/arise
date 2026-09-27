import type { Subscription } from './entitlement';

/**
 * Adaptador de loja.
 *
 * StoreKit 2 e Google Play Billing só existem em build nativo, então a
 * implementação real não roda aqui nem em teste. A interface permite que TODA
 * a lógica de direito de acesso seja exercitada contra uma implementação
 * falsa, e que a real seja um adaptador fino sem regra de negócio dentro.
 */
export interface StoreAdapter {
  /** Direito de acesso atual, validado localmente pelo recibo assinado. */
  currentSubscription(): Promise<Subscription | null>;
  /** Início do teste, conforme a loja — não o relógio do aparelho (R13.9). */
  trialStartedAt(): Promise<string | null>;
  purchase(plan: 'monthly' | 'annual'): Promise<Subscription>;
  /** R13.10 — precisa funcionar sem login. */
  restore(): Promise<Subscription | null>;
  openManagement(): Promise<void>;
}

export class StoreUnavailableError extends Error {
  constructor() {
    super('Loja indisponível');
    this.name = 'StoreUnavailableError';
  }
}

export interface FakeStoreState {
  subscription?: Subscription | null;
  trialStartedAt?: string | null;
  offline?: boolean;
}

/** Implementação falsa para desenvolvimento e teste. */
export function createFakeStore(initial: FakeStoreState = {}): StoreAdapter & {
  setOffline(v: boolean): void;
} {
  let subscription = initial.subscription ?? null;
  const trialStart = initial.trialStartedAt ?? null;
  let offline = initial.offline ?? false;

  const guard = () => { if (offline) throw new StoreUnavailableError(); };

  return {
    setOffline(v) { offline = v; },
    async currentSubscription() { guard(); return subscription; },
    async trialStartedAt() { return trialStart; },
    async purchase(plan) {
      guard();
      const days = plan === 'annual' ? 365 : 30;
      subscription = {
        plan, autoRenew: true,
        expiresAt: new Date(Date.now() + days * 86400_000).toISOString(),
      };
      return subscription;
    },
    async restore() { guard(); return subscription; },
    async openManagement() { /* abre a tela da loja no app real */ },
  };
}
