import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { IconArmy, IconBook, IconHome, IconSword } from '../../src/ui/icons';
import { color, font } from '../../src/ui/tokens';

export default function TabsLayout() {
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
          fontFamily: font.displayMedium,
          fontSize: 10,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        },
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen name="status" options={{ title: 'Status', tabBarIcon: ({ color: c }) => <IconHome c={c} /> }} />
      <Tabs.Screen name="missao" options={{ title: 'Missão', tabBarIcon: ({ color: c }) => <IconSword c={c} /> }} />
      <Tabs.Screen name="codice" options={{ title: 'Códice', tabBarIcon: ({ color: c }) => <IconBook c={c} /> }} />
      <Tabs.Screen name="exercito" options={{ title: 'Exército', tabBarIcon: ({ color: c }) => <IconArmy c={c} /> }} />
    </Tabs>
  );
}
