import { Redirect } from 'expo-router';

/** O onboarding é a porta de entrada. Quando a persistência chegar
 *  (tarefa 21), este redirect passa a consultar se já existe perfil. */
export default function Index() {
  return <Redirect href="/(onboarding)/despertar" />;
}
