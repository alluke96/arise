import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Crypto from 'expo-crypto';
import { getLocales } from 'expo-localization';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ChakraPetch_500Medium, ChakraPetch_600SemiBold, ChakraPetch_700Bold,
} from '@expo-google-fonts/chakra-petch';
import {
  Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold,
} from '@expo-google-fonts/barlow';
import { useFonts } from 'expo-font';
import { color } from '../src/ui/tokens';
import { newId, setDeviceId, setIdGenerator } from '../src/core/ids';
import { repositories } from '../src/core/repositories';
import { resolveLocale } from '../src/core/i18n';
import { useHunter } from '../src/features/hunter/store';
import { bindProfilePersistence, useSettings } from '../src/features/settings/store';
import { syncNotifications } from '../src/features/notifications/adapter';
import { useBilling } from '../src/features/billing/store';

void SplashScreen.preventAutoHideAsync();
setIdGenerator(() => Crypto.randomUUID());

/**
 * Boot: id do aparelho PERSISTIDO (entra no desempate do LWW — um id novo a
 * cada abertura faria o mesmo aparelho parecer vários), preferências do
 * perfil, reconciliação do calendário e missão do dia.
 */
async function bootApp() {
  let deviceId = await repositories.app.getValue('device_id');
  if (!deviceId) {
    deviceId = newId();
    await repositories.app.setValue('device_id', deviceId);
  }
  setDeviceId(deviceId);

  bindProfilePersistence((patch) => { void useHunter.getState().saveProfile(patch); });
  await useHunter.getState().boot();
  const { profile, quest } = useHunter.getState();
  const systemLocale = resolveLocale(getLocales().map((l) => l.languageTag));
  await useSettings.getState().hydrate(profile, systemLocale);
  await useBilling.getState().refresh(useHunter.getState().startedAt);

  if (profile && quest) void syncNotifications(quest, profile.preferredTime);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ChakraPetch_500Medium, ChakraPetch_600SemiBold, ChakraPetch_700Bold,
    Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold,
  });
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    bootApp().finally(() => setBooted(true));
  }, []);

  const ready = fontsLoaded && booted;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
