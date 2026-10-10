import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Vibração curta. Opcional por natureza: no navegador do iPhone não existe,
 * e falhar aqui nunca pode atrapalhar o registro de uma repetição.
 */
export const haptic = {
  impact(style: 'medium' | 'heavy' = 'medium') {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(style === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium)
      .catch(() => {});
  },
  success() {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
