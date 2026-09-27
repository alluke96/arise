import { create } from 'zustand';
import { evaluateAccess, type Entitlement, type Subscription } from '../../core/billing/entitlement';
import { DEMO_MODE, repositories } from '../../core/repositories';

/**
 * Direito de acesso no app.
 *
 * ⚠️ A loja aqui é FALSA: StoreKit 2 e Google Play Billing exigem build nativo
 * e conta de loja (tarefa 38). A "compra" grava uma assinatura local para o
 * fluxo inteiro poder ser exercitado. Trocar por um adaptador real é mexer em
 * `purchase`/`restore` — `evaluateAccess` e as telas não mudam.
 *
 * Enquanto não há recibo assinado da loja, o início do teste é a data de
 * início da jornada gravada no aparelho. Com a loja real, passa a vir do
 * recibo (R13.9).
 */
const SUB_KEY = 'fake_subscription';

interface BillingState {
  entitlement: Entitlement | null;
  subscription: Subscription | null;
  refresh(startedAt: string | null): Promise<void>;
  purchase(plan: 'monthly' | 'annual', startedAt: string | null): Promise<void>;
  restore(startedAt: string | null): Promise<void>;
}

const UNLIMITED: Subscription = { expiresAt: '9999-12-31T00:00:00.000Z', autoRenew: false, plan: 'annual' };

export const useBilling = create<BillingState>((set, get) => ({
  entitlement: null,
  subscription: null,

  async refresh(startedAt) {
    let subscription: Subscription | null = DEMO_MODE ? UNLIMITED : null;
    const raw = await repositories.app.getValue(SUB_KEY);
    try { if (raw) subscription = JSON.parse(raw) as Subscription; } catch { /* sem assinatura */ }
    const now = new Date().toISOString();
    set({
      subscription,
      entitlement: evaluateAccess({
        now,
        trialStartedAt: startedAt ? `${startedAt}T00:00:00.000Z` : null,
        subscription,
        lastValidatedAt: now,
        offline: false,
      }),
    });
  },

  async purchase(plan, startedAt) {
    const days = plan === 'annual' ? 365 : 30;
    const subscription: Subscription = {
      plan, autoRenew: true, expiresAt: new Date(Date.now() + days * 86400_000).toISOString(),
    };
    await repositories.app.setValue(SUB_KEY, JSON.stringify(subscription));
    await get().refresh(startedAt);
  },

  async restore(startedAt) {
    await get().refresh(startedAt);
  },
}));
