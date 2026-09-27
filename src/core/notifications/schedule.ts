import type { DailyQuest } from '../types';

/**
 * Agendamento de notificações — R4.12, R1.12.
 *
 * Lógica pura: decide O QUE agendar e QUANDO. Não fala com o sistema
 * operacional. `expo-notifications` só recebe a lista pronta.
 */
export const MAX_PER_DAY = 3;

export type NotificationKind =
  | 'quest_available' | 'four_hours_left' | 'one_hour_left' | 'quest_completed';

export interface ScheduledNotification {
  kind: NotificationKind;
  at: string;
  /** Chave de i18n do namespace `system`, resolvida no tom ativo. */
  systemKey: string;
}

export interface NotificationPrefs {
  enabled: boolean;
  questAvailable: boolean;
  deadlineWarnings: boolean;
  completion: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true, questAvailable: true, deadlineWarnings: true, completion: true,
};

const HOUR = 3600_000;

/**
 * Máximo de 3 por dia. Um app de hábito que notifica demais é desinstalado,
 * então o limite é imposto aqui e não confiado à disciplina de quem chama.
 */
export function planNotifications(
  quest: DailyQuest, preferredTime: string, prefs: NotificationPrefs, now: string,
): ScheduledNotification[] {
  if (!prefs.enabled) return [];
  if (quest.isRestDay) return [];

  const out: ScheduledNotification[] = [];
  const nowMs = Date.parse(now);
  const deadline = Date.parse(quest.deadline);

  if (prefs.questAvailable) {
    // Horário LOCAL, como o prazo. Uma versão anterior usava setUTCHours: quem
    // escolheu 19h em São Paulo seria avisado às 16h.
    const [h, m] = preferredTime.split(':').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    const at = new Date(`${quest.date}T${pad(h ?? 19)}:${pad(m ?? 0)}:00`);
    if (at.getTime() > nowMs) {
      out.push({ kind: 'quest_available', at: at.toISOString(), systemKey: 'questAvailable' });
    }
  }

  if (prefs.deadlineWarnings && quest.status !== 'completed') {
    for (const [hours, kind, key] of [
      [4, 'four_hours_left', 'fourHoursLeft'],
      [1, 'one_hour_left', 'oneHourLeft'],
    ] as const) {
      const at = deadline - hours * HOUR;
      if (at > nowMs) out.push({ kind, at: new Date(at).toISOString(), systemKey: key });
    }
  }

  return out
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .slice(0, MAX_PER_DAY);
}

/** Nada é agendado para o passado — o SO dispararia na hora. */
export function isSchedulable(n: ScheduledNotification, now: string): boolean {
  return Date.parse(n.at) > Date.parse(now);
}
