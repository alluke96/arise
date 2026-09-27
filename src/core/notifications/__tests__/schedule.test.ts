import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, MAX_PER_DAY, isSchedulable, planNotifications } from '../schedule';
import type { DailyQuest } from '../../types';

const quest = (over: Partial<DailyQuest> = {}): DailyQuest => ({
  id: 'q', date: '2026-09-21', rank: 'D', objectives: [], status: 'pending',
  deadline: '2026-09-21T23:59:59.000Z', isDeload: false, isRestDay: false,
  xpAwarded: null, ...over,
});

const MORNING = '2026-09-21T08:00:00.000Z';

describe('plano de notificações', () => {
  it('agenda a missão no horário escolhido e os dois avisos de prazo', () => {
    const out = planNotifications(quest(), '19:00', DEFAULT_PREFS, MORNING);
    expect(out.map((n) => n.kind)).toEqual(['quest_available', 'four_hours_left', 'one_hour_left']);
  });

  /** Notificar demais é desinstalação. O teto é imposto aqui, não confiado. */
  it('nunca passa de 3 por dia', () => {
    const out = planNotifications(quest(), '00:30', DEFAULT_PREFS, '2026-09-21T00:00:00.000Z');
    expect(out.length).toBeLessThanOrEqual(MAX_PER_DAY);
  });

  it('desligar notificações silencia tudo', () => {
    expect(planNotifications(quest(), '19:00', { ...DEFAULT_PREFS, enabled: false }, MORNING))
      .toHaveLength(0);
  });

  it('cada preferência desliga só o seu grupo', () => {
    const noQuest = planNotifications(quest(), '19:00', { ...DEFAULT_PREFS, questAvailable: false }, MORNING);
    expect(noQuest.map((n) => n.kind)).toEqual(['four_hours_left', 'one_hour_left']);

    const noWarnings = planNotifications(quest(), '19:00', { ...DEFAULT_PREFS, deadlineWarnings: false }, MORNING);
    expect(noWarnings.map((n) => n.kind)).toEqual(['quest_available']);
  });

  it('dia de descanso não notifica', () => {
    expect(planNotifications(quest({ isRestDay: true }), '19:00', DEFAULT_PREFS, MORNING))
      .toHaveLength(0);
  });

  it('missão concluída não recebe aviso de prazo', () => {
    const out = planNotifications(quest({ status: 'completed' }), '19:00', DEFAULT_PREFS, MORNING);
    expect(out.map((n) => n.kind)).toEqual(['quest_available']);
  });

  it('nada é agendado para o passado', () => {
    const late = '2026-09-21T23:50:00.000Z';
    for (const n of planNotifications(quest(), '19:00', DEFAULT_PREFS, late)) {
      expect(isSchedulable(n, late), n.kind).toBe(true);
    }
  });

  it('sai em ordem cronológica', () => {
    const out = planNotifications(quest(), '19:00', DEFAULT_PREFS, MORNING);
    const times = out.map((n) => Date.parse(n.at));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('cada notificação aponta para uma chave do namespace system', () => {
    for (const n of planNotifications(quest(), '19:00', DEFAULT_PREFS, MORNING)) {
      expect(n.systemKey.length).toBeGreaterThan(3);
    }
  });
});
