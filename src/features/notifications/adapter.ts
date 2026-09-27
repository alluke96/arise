import * as Notifications from 'expo-notifications';
import { planNotifications } from '../../core/notifications/schedule';
import { systemText, t } from '../../core/i18n';
import type { DailyQuest } from '../../core/types';
import { useSettings } from '../settings/store';

/**
 * Adaptador fino: o QUE e QUANDO agendar é decidido por `planNotifications`
 * (puro, testado). Aqui só se entrega a lista ao sistema operacional.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

/** R1.12 — pedida ao fim do onboarding, com contexto, nunca na abertura. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function syncNotifications(quest: DailyQuest, preferredTime: string): Promise<void> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const prefs = useSettings.getState().notifications;
    for (const n of planNotifications(quest, preferredTime, prefs, new Date().toISOString())) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('app.name'),
          body: systemText(n.systemKey as Parameters<typeof systemText>[0]),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at) },
      });
    }
  } catch {
    // Notificação é conveniência: falhar aqui nunca pode impedir o treino.
  }
}
