import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HudLabel, IconAlert, Note, Screen, SystemButton, SystemWindow, Txt, color, font, space } from '../src/ui';
import { useAuth } from '../src/features/auth/store';
import { useT } from '../src/features/settings/store';

/** Entrada do build de teste pessoal. Credencial fixa em `core/config.ts`. */
export default function Login() {
  const router = useRouter();
  const t = useT();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const ok = await useAuth.getState().login(user, password);
    setBusy(false);
    if (!ok) { setError(true); return; }
    router.replace('/');
  };

  return (
    <Screen tone="ritual">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.head}>
          <HudLabel tone="blue">{t('auth.testBuild')}</HudLabel>
          <Txt variant="title" style={styles.title}>ARISE</Txt>
          <Txt variant="bodySm" tone="dim">{t('auth.subtitle')}</Txt>
        </View>

        <SystemWindow padding={18}>
          <HudLabel tone="muted" style={styles.label}>{t('auth.user')}</HudLabel>
          <View style={styles.input}>
            <TextInput
              accessibilityLabel={t('auth.user')}
              value={user}
              onChangeText={(v) => { setUser(v); setError(false); }}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              returnKeyType="next"
              placeholderTextColor={color.textMuted}
              style={styles.inputText}
            />
          </View>

          <HudLabel tone="muted" style={[styles.label, { marginTop: 14 }]}>{t('auth.password')}</HudLabel>
          <View style={styles.input}>
            <TextInput
              accessibilityLabel={t('auth.password')}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(false); }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              style={styles.inputText}
            />
          </View>
        </SystemWindow>

        {error && (
          <Note tone="red" icon={<IconAlert />}>
            <Txt variant="bodySm" tone="dim">{t('auth.invalid')}</Txt>
          </Note>
        )}

        <SystemButton label={busy ? '…' : t('auth.enter')} height={56} onPress={submit}
          disabled={busy || !user || !password} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: space.xl, justifyContent: 'center', gap: space.lg },
  head: { gap: 8, alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 40, letterSpacing: 8, fontFamily: font.display },
  label: { fontSize: 11, marginBottom: 6 },
  input: {
    height: 50, paddingHorizontal: 14, justifyContent: 'center',
    backgroundColor: color.surfaceRaised, borderWidth: 1, borderColor: color.purpleBorder,
  },
  inputText: { color: color.text, fontSize: 17, fontFamily: font.body },
});
