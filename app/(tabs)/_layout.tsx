import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/features/auth/store';
import { TEST_BUILD } from '../../src/core/config';
import { Platform } from 'react-native';
import { IconArmy, IconBook, IconHome, IconSword } from '../../src/ui/icons';
import { color, font } from '../../src/ui/tokens';
import { useT } from '../../src/features/settings/store';

export default function TabsLayout() {
  const t = useT();
  const loggedIn = useAuth((s) => s.loggedIn);
  // Build de teste: link direto para uma aba não pula o login.
  if (TEST_BUILD && !loggedIn) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.blue,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(9,5,20,0.97)',
          borderTopColor: color.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: 9,
        },
        tabBarLabelStyle: {
          fontFamily: font.displayMedium, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase',
        },
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen name="status" options={{ title: t('tabs.status'), tabBarIcon: ({ color: c }) => <IconHome c={c} /> }} />
      <Tabs.Screen name="missao" options={{ title: t('tabs.quest'), tabBarIcon: ({ color: c }) => <IconSword c={c} /> }} />
      <Tabs.Screen name="codice" options={{ title: t('tabs.codex'), tabBarIcon: ({ color: c }) => <IconBook c={c} /> }} />
      <Tabs.Screen name="exercito" options={{ title: t('tabs.army'), tabBarIcon: ({ color: c }) => <IconArmy c={c} /> }} />
    </Tabs>
  );
}
