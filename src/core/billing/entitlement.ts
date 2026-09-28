/**
 * Direito de acesso — R13.
 *
 * Lógica pura: recebe estado, devolve estado. Nenhuma chamada de rede, nenhum
 * SDK de loja. É o que permite testar exaustivamente o comportamento que
 * decide se alguém consegue treinar hoje.
 */

/**
 * R13.2 — a duração do teste é UMA constante.
 *
 * O paywall cai no dia 3, que é quando a dor muscular tardia atinge o pico e
 * o hábito ainda não se formou (§22.1 do product brief). Trocar por 7 dias ou
 * por "3 missões concluídas" precisa ser mudança de uma linha, não de
 * arquitetura — os dados dos primeiros usuários decidem, não opinião.
 */
export const TRIAL_DAYS = 3;

/** R13.8 — tolerância quando a validação falha por falta de rede. */
export const OFFLINE_GRACE_HOURS = 72;

export type AccessState = 'trial' | 'subscribed' | 'grace' | 'locked';

export type LockReason =
  | 'trial_expired' | 'subscription_expired' | 'grace_expired' | 'never_started';

export interface Subscription {
  /** Fim do período pago, vindo assinado pela loja. */
  expiresAt: string;
  autoRenew: boolean;
  plan: 'monthly' | 'annual';
}

export interface EntitlementInput {
  now: string;
  /**
   * R13.9 — vem do recibo assinado pela loja, NUNCA de `Date.now()` local.
   * Mexer no relógio do aparelho não estende o teste.
   */
  trialStartedAt: string | null;
  subscription: Subscription | null;
  /** Última vez que a loja confirmou o direito de acesso. */
  lastValidatedAt: string | null;
  /** A validação mais recente falhou por falta de rede? */
  offline: boolean;
}

export interface Entitlement {
  state: AccessState;
  reason: LockReason | null;
  trialDaysLeft: number;
  graceHoursLeft: number;
  /** Treinar exige direito de acesso ativo. */
  canTrain: boolean;
  /** R13.5 — histórico continua legível depois do bloqueio. */
  canViewHistory: boolean;
  /** R13.5/R12.6 — exportar NUNCA é bloqueado, em estado nenhum. */
  canExport: boolean;
  /** A tela de assinatura é sempre alcançável. */
  canManageSubscription: boolean;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const ms = (iso: string) => new Date(iso).getTime();

export function trialEndsAt(trialStartedAt: string, days = TRIAL_DAYS): string {
  return new Date(ms(trialStartedAt) + days * DAY).toISOString();
}

export function evaluateAccess(input: EntitlementInput): Entitlement {
  const now = ms(input.now);

  const base = {
    canViewHistory: true,
    canExport: true,
    canManageSubscription: true,
  };

  const locked = (reason: LockReason): Entitlement => ({
    ...base, state: 'locked', reason, trialDaysLeft: 0, graceHoursLeft: 0, canTrain: false,
  });

  // 1. Assinatura válida vence tudo.
  if (input.subscription && ms(input.subscription.expiresAt) > now) {
    return {
      ...base,
      state: 'subscribed',
      reason: null,
      trialDaysLeft: 0,
      graceHoursLeft: 0,
      canTrain: true,
    };
  }

  // 2. Sem rede para validar: tolerância a partir da última confirmação.
  //    Um assinante no metrô, no avião ou num parque sem sinal NUNCA pode
  //    perder o treino por causa disso.
  if (input.offline && input.lastValidatedAt) {
    const elapsedHours = (now - ms(input.lastValidatedAt)) / HOUR;
    if (elapsedHours < OFFLINE_GRACE_HOURS) {
      return {
        ...base,
        state: 'grace',
        reason: null,
        trialDaysLeft: 0,
        graceHoursLeft: Math.max(0, Math.ceil(OFFLINE_GRACE_HOURS - elapsedHours)),
        canTrain: true,
      };
    }
    return locked('grace_expired');
  }

  // 3. Assinatura vencida com a rede disponível.
  if (input.subscription) return locked('subscription_expired');

  // 4. Teste grátis.
  if (!input.trialStartedAt) return locked('never_started');

  const endsAt = ms(trialEndsAt(input.trialStartedAt));
  if (now < endsAt) {
    return {
      ...base,
      state: 'trial',
      reason: null,
      trialDaysLeft: Math.max(0, Math.ceil((endsAt - now) / DAY)),
      graceHoursLeft: 0,
      canTrain: true,
    };
  }
  return locked('trial_expired');
}

// ── Planos ─────────────────────────────────────────────────────────────────

export interface Plan {
  id: 'monthly' | 'annual';
  priceBRL: number;
  priceUSD: number;
  /** R13.4 — o anual vem pré-selecionado, com o desconto explícito. */
  preselected: boolean;
}

export const PLANS: Plan[] = [
  // R$ 2/mês por decisão de produto (set/2026). O anual sai a ~R$ 1,07/mês,
  // 46% abaixo de 12 mensalidades — o desconto precisa ser grande para o
  // anual pré-selecionado fazer sentido (R13.4).
  { id: 'monthly', priceBRL: 2.0, priceUSD: 0.99, preselected: false },
  { id: 'annual', priceBRL: 12.9, priceUSD: 5.99, preselected: true },
];

/** Desconto do anual sobre 12 meses do mensal, para exibir no paywall. */
export function annualSavingPercent(plans: Plan[] = PLANS): number {
  const monthly = plans.find((p) => p.id === 'monthly');
  const annual = plans.find((p) => p.id === 'annual');
  if (!monthly || !annual) return 0;
  return Math.round((1 - annual.priceBRL / (monthly.priceBRL * 12)) * 100);
}
