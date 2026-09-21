import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { repositories } from '../src/core/repositories';
import { color } from '../src/ui/tokens';

/**
 * Porta de entrada em "/".
 *
 * As abas vivem em rotas nomeadas (/status, /missao, /codice, /exercito) —
 * um grupo `(tabs)` não adiciona segmento de path, então um
 * `(tabs)/index.tsx` disputaria "/" com este arquivo e o app abriria direto
 * nas abas, pulando o onboarding.
 */
export default function Index() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    void repositories.profile.isOnboarded().then(setOnboarded);
  }, []);

  if (onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  }
  return <Redirect href={onboarded ? '/status' : '/(onboarding)/despertar'} />;
}
