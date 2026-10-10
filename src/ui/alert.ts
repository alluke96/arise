import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * `Alert.alert` que funciona também na web.
 *
 * No React Native Web o `Alert.alert` não faz NADA: confirmações como
 * "Apagar tudo" ou as do Laboratório simplesmente não apareceriam no app
 * instalado no iPhone, e a ação nunca rodaria. Na web vira `confirm`/`alert`
 * do navegador.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const action = buttons?.find((b) => b.style !== 'cancel');
  const cancel = buttons?.find((b) => b.style === 'cancel');
  if (buttons && buttons.length > 1 && action) {
    if (window.confirm(text)) action.onPress?.();
    else cancel?.onPress?.();
    return;
  }
  window.alert(text);
  buttons?.[0]?.onPress?.();
}
