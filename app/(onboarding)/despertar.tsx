import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HudLabel, IconArrow, Screen, SystemButton, Txt, color, space } from '../../src/ui';

export default function Despertar() {
  const router = useRouter();

  return (
    <Screen tone="ritual">
      <View style={styles.root}>
        <View style={styles.signal}>
          <View style={styles.dot} />
          <HudLabel tone="red" style={{ fontSize: 11 }}>Sinal detectado</HudLabel>
        </View>

        <View style={styles.log}>
          <Txt variant="bodySm" tone="muted" style={styles.mono}>&gt; Analisando candidato…</Txt>
          <Txt variant="bodySm" tone="muted" style={styles.mono}>
            &gt; Capacidade de mana: <Txt tone="red" style={styles.mono}>não mensurável</Txt>
          </Txt>
          <Txt variant="bodySm" tone="muted" style={styles.mono}>
            &gt; Classificação provisória: <Txt style={styles.mono}>E</Txt>
          </Txt>
          <Txt variant="bodySm" tone="blue" style={styles.mono}>
            &gt; Você é o caçador mais fraco da humanidade.
          </Txt>
        </View>

        <View style={styles.center}>
          {/* Wordmark: ÚNICO lugar onde o nome aparece. Trocar o nome é
              trocar esta string e a chave app.name — nada mais. */}
          <Txt style={styles.wordmark}>ARISE</Txt>
          <View style={styles.rule} />
          <HudLabel tone="purple" style={{ fontSize: 12 }}>Erguei-vos</HudLabel>
          <Txt variant="body" tone="dim" style={styles.pitch}>
            Ninguém mais recebeu este convite.{'\n'}
            A partir de hoje, <Txt variant="bodyStrong">você é o Jogador</Txt> — o único que sobe de nível.
          </Txt>
        </View>

        <View style={styles.actions}>
          <SystemButton
            label="Aceitar"
            icon={<IconArrow />}
            onPress={() => router.push('/(onboarding)/biometria')}
          />
          <SystemButton label="Recusar" variant="ghost" height={48} />
          <Txt variant="bodySm" tone="muted" style={styles.legal}>
            Este app não substitui avaliação médica.{'\n'}
            A triagem de saúde é obrigatória antes do primeiro treino.
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 24 },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: {
    width: 7, height: 7, backgroundColor: color.red,
    shadowColor: color.red, shadowOpacity: 1, shadowRadius: 9, shadowOffset: { width: 0, height: 0 },
  },
  log: { marginTop: 32, gap: 11 },
  mono: { fontSize: 14, letterSpacing: 0.6, lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  wordmark: {
    fontFamily: 'ChakraPetch_700Bold', fontSize: 56, color: '#FFFFFF',
    letterSpacing: 16, marginLeft: 16,
    textShadowColor: 'rgba(167,139,250,0.85)', textShadowRadius: 26,
  },
  rule: {
    width: 196, height: 1, backgroundColor: color.blue,
    shadowColor: color.blue, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  pitch: { textAlign: 'center', maxWidth: 292, marginTop: 14, fontSize: 16, lineHeight: 26 },
  actions: { gap: space.md },
  legal: { textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 4 },
});
