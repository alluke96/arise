import type { DailyQuest } from '../../core/types';

/**
 * Web / iPhone pela Tela de Início: o navegador não agenda notificação local
 * sem um servidor de push. As funções existem para as telas não precisarem
 * saber em que plataforma estão.
 */
export const NOTIFICATIONS_SUPPORTED = false;

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function syncNotifications(_quest: DailyQuest, _preferredTime: string): Promise<void> {
  // Sem agendamento local na web.
}
