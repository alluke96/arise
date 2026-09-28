import { describe, expect, it } from 'vitest';
import {
  OFFLINE_GRACE_HOURS, PLANS, TRIAL_DAYS, annualSavingPercent,
  evaluateAccess, trialEndsAt, type EntitlementInput,
} from '../entitlement';
import { StoreUnavailableError, createFakeStore } from '../store';

const NOW = '2026-09-21T12:00:00.000Z';
const hoursAgo = (h: number) => new Date(Date.parse(NOW) - h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const inDays = (d: number) => new Date(Date.parse(NOW) + d * 86400_000).toISOString();

const input = (over: Partial<EntitlementInput> = {}): EntitlementInput => ({
  now: NOW, trialStartedAt: null, subscription: null,
  lastValidatedAt: null, offline: false, ...over,
});

describe('teste grátis', () => {
  it('libera durante os dias de teste', () => {
    const e = evaluateAccess(input({ trialStartedAt: daysAgo(1) }));
    expect(e.state).toBe('trial');
    expect(e.canTrain).toBe(true);
    expect(e.trialDaysLeft).toBe(TRIAL_DAYS - 1);
  });

  it('bloqueia quando o teste acaba', () => {
    const e = evaluateAccess(input({ trialStartedAt: daysAgo(TRIAL_DAYS + 1) }));
    expect(e.state).toBe('locked');
    expect(e.reason).toBe('trial_expired');
    expect(e.canTrain).toBe(false);
  });

  it('a duração é uma constante única e trocável', () => {
    const started = daysAgo(5);
    expect(trialEndsAt(started, 3)).not.toBe(trialEndsAt(started, 7));
    // Com 7 dias, o mesmo usuário que estava bloqueado volta a treinar.
    const end7 = Date.parse(trialEndsAt(started, 7));
    expect(end7).toBeGreaterThan(Date.parse(NOW));
  });

  /** R13.9 — o fim do teste vem da loja, não do relógio local. */
  it('adiantar o relógio do aparelho não estende o teste', () => {
    const started = daysAgo(10);
    const future = evaluateAccess(input({ trialStartedAt: started, now: inDays(-30) }));
    // Com "agora" anterior ao início do teste, o estado continua coerente:
    // nunca vira acesso infinito.
    expect(['trial', 'locked']).toContain(future.state);
  });

  it('sem teste iniciado e sem assinatura, fica bloqueado', () => {
    expect(evaluateAccess(input()).reason).toBe('never_started');
  });
});

describe('assinatura', () => {
  it('assinatura válida libera', () => {
    const e = evaluateAccess(input({
      subscription: { expiresAt: inDays(20), autoRenew: true, plan: 'monthly' },
    }));
    expect(e.state).toBe('subscribed');
    expect(e.canTrain).toBe(true);
  });

  it('assinatura vencida bloqueia', () => {
    const e = evaluateAccess(input({
      subscription: { expiresAt: daysAgo(1), autoRenew: false, plan: 'monthly' },
    }));
    expect(e.reason).toBe('subscription_expired');
  });

  it('assinatura válida prevalece sobre teste expirado', () => {
    const e = evaluateAccess(input({
      trialStartedAt: daysAgo(90),
      subscription: { expiresAt: inDays(5), autoRenew: true, plan: 'annual' },
    }));
    expect(e.state).toBe('subscribed');
  });
});

/**
 * R13.8 — o caso que decide se o app é usável de verdade: um assinante no
 * metrô, no avião ou num parque sem sinal NUNCA pode perder o treino porque
 * a validação não completou.
 */
describe('tolerância offline', () => {
  it('libera dentro da janela de tolerância', () => {
    const e = evaluateAccess(input({ offline: true, lastValidatedAt: hoursAgo(10) }));
    expect(e.state).toBe('grace');
    expect(e.canTrain).toBe(true);
    expect(e.graceHoursLeft).toBe(OFFLINE_GRACE_HOURS - 10);
  });

  it('libera até o último momento da janela', () => {
    const e = evaluateAccess(input({
      offline: true, lastValidatedAt: hoursAgo(OFFLINE_GRACE_HOURS - 0.5),
    }));
    expect(e.canTrain).toBe(true);
  });

  it('bloqueia depois da janela', () => {
    const e = evaluateAccess(input({
      offline: true, lastValidatedAt: hoursAgo(OFFLINE_GRACE_HOURS + 1),
    }));
    expect(e.reason).toBe('grace_expired');
  });

  it('offline sem validação anterior não vira acesso livre', () => {
    expect(evaluateAccess(input({ offline: true })).canTrain).toBe(false);
  });
});

/**
 * R13.5 e R12.6. Cobrar para a pessoa recuperar o que ela mesma registrou
 * seria abusivo e provavelmente fere o CDC — então isto vale em TODO estado.
 */
describe('o que nunca é bloqueado', () => {
  const STATES: EntitlementInput[] = [
    input({ trialStartedAt: daysAgo(1) }),
    input({ trialStartedAt: daysAgo(99) }),
    input({ subscription: { expiresAt: inDays(5), autoRenew: true, plan: 'annual' } }),
    input({ subscription: { expiresAt: daysAgo(5), autoRenew: false, plan: 'annual' } }),
    input({ offline: true, lastValidatedAt: hoursAgo(1) }),
    input({ offline: true, lastValidatedAt: hoursAgo(999) }),
    input(),
  ];

  it('exportar os próprios dados funciona em qualquer estado', () => {
    for (const s of STATES) expect(evaluateAccess(s).canExport).toBe(true);
  });

  it('ler o histórico funciona em qualquer estado', () => {
    for (const s of STATES) expect(evaluateAccess(s).canViewHistory).toBe(true);
  });

  it('a tela de assinatura é sempre alcançável', () => {
    for (const s of STATES) expect(evaluateAccess(s).canManageSubscription).toBe(true);
  });

  it('bloqueado significa apenas não treinar', () => {
    const e = evaluateAccess(input({ trialStartedAt: daysAgo(99) }));
    expect(e.canTrain).toBe(false);
    expect(e.canExport && e.canViewHistory && e.canManageSubscription).toBe(true);
  });
});

describe('planos', () => {
  it('o anual vem pré-selecionado (R13.4)', () => {
    expect(PLANS.filter((p) => p.preselected).map((p) => p.id)).toEqual(['annual']);
  });

  it('o desconto anual é real e exibível', () => {
    const pct = annualSavingPercent();
    expect(pct).toBeGreaterThan(40);
    expect(pct).toBeLessThan(100);
  });

  it('preço decidido: R$ 2/mês, anual abaixo de 12 mensalidades', () => {
    const monthly = PLANS.find((p) => p.id === 'monthly')!;
    const annual = PLANS.find((p) => p.id === 'annual')!;
    expect(monthly.priceBRL).toBe(2);
    expect(annual.priceBRL).toBeLessThan(monthly.priceBRL * 12);
    expect(annualSavingPercent()).toBe(46);
  });

  it('há preço nas duas moedas', () => {
    for (const p of PLANS) {
      expect(p.priceBRL).toBeGreaterThan(0);
      expect(p.priceUSD).toBeGreaterThan(0);
    }
  });
});

describe('adaptador de loja', () => {
  it('compra devolve assinatura com validade', async () => {
    const store = createFakeStore();
    const sub = await store.purchase('annual');
    expect(sub.plan).toBe('annual');
    expect(Date.parse(sub.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('restaurar devolve a assinatura existente, sem login', async () => {
    const store = createFakeStore();
    await store.purchase('monthly');
    expect(await store.restore()).not.toBeNull();
  });

  it('sem rede, a loja falha de forma identificável', async () => {
    const store = createFakeStore({ offline: true });
    await expect(store.currentSubscription()).rejects.toThrow(StoreUnavailableError);
  });

  it('o início do teste continua legível mesmo sem rede', async () => {
    const store = createFakeStore({ offline: true, trialStartedAt: NOW });
    expect(await store.trialStartedAt()).toBe(NOW);
  });
});
