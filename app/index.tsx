import { Redirect } from 'expo-router';
import { useHunter } from '../src/features/hunter/store';
import { useAuth } from '../src/features/auth/store';
import { TEST_BUILD } from '../src/core/config';

/**
 * Porta de entrada em "/". Build de teste sem login → login; sem perfil →
 * onboarding; com perfil → abas.
 *
 * As abas vivem em rotas nomeadas (/status, /missao…): um grupo `(tabs)` não
 * adiciona segmento de path, então um `(tabs)/index.tsx` disputaria "/" com
 * este arquivo e o app pularia o onboarding.
 */
export default function Index() {
  const loggedIn = useAuth((s) => s.loggedIn);
  const profile = useHunter((s) => s.profile);
  const startedAt = useHunter((s) => s.startedAt);
  if (TEST_BUILD && !loggedIn) return <Redirect href="/login" />;
  return <Redirect href={profile && startedAt ? '/status' : '/(onboarding)/despertar'} />;
}
