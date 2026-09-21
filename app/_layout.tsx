import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ChakraPetch_500Medium, ChakraPetch_600SemiBold, ChakraPetch_700Bold,
} from '@expo-google-fonts/chakra-petch';
import {
  Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold,
} from '@expo-google-fonts/barlow';
import { useFonts } from 'expo-font';
import { color } from '../src/ui/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    ChakraPetch_500Medium, ChakraPetch_600SemiBold, ChakraPetch_700Bold,
    Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

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
