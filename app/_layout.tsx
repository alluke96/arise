import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { initRepositories, repositories } from '../src/core/repositories';
import { resolveLocale } from '../src/core/i18n';
import { loadClockOffset, useHunter } from '../src/features/hunter/store';
import { useAuth } from '../src/features/auth/store';
import { TEST_BUILD } from '../src/core/config';
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
  // Na web o banco vem do IndexedDB: abre antes de qualquer leitura.
  await initRepositories();
  let deviceId = await repositories.app.getValue('device_id');
  if (!deviceId) {
    deviceId = newId();
    await repositories.app.setValue('device_id', deviceId);
  }
  setDeviceId(deviceId);

  bindProfilePersistence((patch) => { void useHunter.getState().saveProfile(patch); });
  if (TEST_BUILD) {
    await useAuth.getState().hydrate();
    await loadClockOffset();
  }
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
  const { width } = useWindowDimensions();
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    bootApp()
      .catch((e: unknown) => setBootError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBooted(true));
  }, []);

  const ready = fontsLoaded && booted;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  /**
   * Virada de dia. O celular mantém o app suspenso de um dia para o outro;
   * sem isto, abrir de manhã mostrava a missão de ontem e a penalidade só
   * aparecia quando o app fosse fechado de vez. Checa ao voltar ao primeiro
   * plano e a cada minuto com o app aberto (passa da meia-noite na tela).
   */
  useEffect(() => {
    if (!ready) return;
    const check = async () => {
      if (!(await useHunter.getState().refreshDay())) return;
      const { profile, quest, startedAt } = useHunter.getState();
      await useBilling.getState().refresh(startedAt);
      if (profile && quest) void syncNotifications(quest, profile.preferredTime);
    };
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') void check(); });
    const tick = setInterval(() => { void check(); }, 60_000);
    return () => { sub.remove(); clearInterval(tick); };
  }, [ready]);

  if (!ready) return null;

  // Sem banco não há app: melhor dizer o porquê do que abrir telas que vão
  // falhar ao gravar.
  if (bootError) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, justifyContent: 'center', padding: 28 }}>
        <Text style={{ color: color.redText, fontSize: 16, marginBottom: 8 }}>Não foi possível abrir os dados do Arise.</Text>
        <Text style={{ color: color.textDim, fontSize: 13 }}>{bootError}</Text>
      </View>
    );
  }

  const app = (
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

  // Web num monitor: o app fica numa coluna do tamanho de um celular, no
  // centro, com o fundo preenchendo as laterais. Esticar formulário e botões
  // por 1900 px deixava tudo desproporcional.
  if (Platform.OS === 'web' && width > WEB_COLUMN + 40) {
    return (
      <View style={styles.webStage}>
        <View style={styles.webColumn}>{app}</View>
      </View>
    );
  }
  return app;
}

/** Largura da coluna do app na web em telas grandes (um celular grande). */
const WEB_COLUMN = 440;

const styles = StyleSheet.create({
  webStage: {
    flex: 1, alignItems: 'center', backgroundColor: color.bgDeep,
    // @ts-expect-error — propriedade só da web: halo roxo atrás da coluna.
    backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(124,58,237,0.22), rgba(9,4,26,0) 60%)',
  },
  webColumn: {
    flex: 1, width: '100%', maxWidth: WEB_COLUMN, overflow: 'hidden',
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: color.line,
    shadowColor: color.purple, shadowOpacity: 0.35, shadowRadius: 40, shadowOffset: { width: 0, height: 0 },
  },
});
