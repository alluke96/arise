import { Redirect } from 'expo-router';
import { useHunter } from '../src/features/hunter/store';

/**
 * Porta de entrada em "/". Sem perfil → onboarding; com perfil → abas.
 *
 * As abas vivem em rotas nomeadas (/status, /missao…): um grupo `(tabs)` não
 * adiciona segmento de path, então um `(tabs)/index.tsx` disputaria "/" com
 * este arquivo e o app pularia o onboarding.
 */
export default function Index() {
  const profile = useHunter((s) => s.profile);
  const startedAt = useHunter((s) => s.startedAt);
  return <Redirect href={profile && startedAt ? '/status' : '/(onboarding)/despertar'} />;
}
