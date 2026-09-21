import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconCheck, IconInfo, Screen, StatBar, SystemButton, SystemWindow,
  Txt, color, font, space,
} from '../src/ui';
import { PENALTY_DURATION_SECONDS } from '../src/core/engine';
import { useProgression } from '../src/features/progression/store';

const STEPS = [
  { name: 'Gato-camelo', seconds: 60, done: true },
  { name: 'Marcha no lugar', seconds: 90, done: false, active: true },
  { name: 'Alongamento de peitoral', seconds: 45, done: false },
  { name: 'Respiração 4-7-8', seconds: 45, done: false },
];

export default function Penalidade() {
  const router = useRouter();
  const { progression } = useProgression();
  const elapsed = 19;
  const remaining = PENALTY_DURATION_SECONDS - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Screen tone="penalty">
      <View style={styles.root}>
        <View style={styles.signal}>
          <View style={styles.dot} />
          <HudLabel tone="red" style={{ fontSize: 11 }}>Missão diária não concluída</HudLabel>
        </View>

        <Txt style={styles.title}>ZONA DE{'\n'}PENALIDADE</Txt>
        <Txt variant="body" tone="dim" style={styles.lede}>
          Você tem <Txt variant="bodyStrong">4 minutos</Txt> para sair daqui.
          Nada de intenso — mobilidade e caminhada no lugar.
        </Txt>

        <SystemWindow variant="alert" chamfer={17} padding={24}>
          <View style={{ alignItems: 'center' }}>
            <HudLabel tone="red" style={{ fontSize: 11 }}>Tempo restante</HudLabel>
            <Txt style={styles.timer}>{mm}:{ss}</Txt>
            <View style={{ width: '100%' }}>
              <StatBar ratio={elapsed / PENALTY_DURATION_SECONDS} fill={color.red} />
            </View>
          </View>
        </SystemWindow>

        <View style={styles.steps}>
          {STEPS.map((s) => (
            <View key={s.name} style={[
              styles.step,
              s.done && styles.stepDone,
              s.active && styles.stepActive,
              !s.done && !s.active && styles.stepIdle,
            ]}>
              {s.done ? <IconCheck /> : (
                <View style={[styles.bullet, s.active && styles.bulletActive]} />
              )}
              <Txt variant="body" tone={s.done ? 'default' : s.active ? 'default' : 'muted'}
                style={{ flex: 1, fontSize: 14.5 }}>
                {s.name}
              </Txt>
              <Txt variant="bodySm" tone={s.active ? 'red' : 'muted'}
                style={{ fontFamily: font.displayMedium }}>{s.seconds}s</Txt>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* R8.5 — a garantia mais importante do app, dita em voz alta na
            tela onde o usuário mais precisa lê-la. */}
        <View style={styles.reassurance}>
          <IconInfo />
          <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
            Isto não é castigo. Concluir{' '}
            <Txt variant="bodySm" tone="default">
              restaura sua sequência de {progression.streakCurrent} dias
            </Txt>{' '}
            e devolve metade do XP. Seu nível, rank e histórico nunca são apagados — em nenhuma hipótese.
          </Txt>
        </View>

        <SystemButton label="Sobreviver" variant="danger" height={58}
          onPress={() => router.replace('/(tabs)')} />
        <SystemButton
          label={`Usar pedra de recuperação (${progression.recoveryStones})`}
          variant="ghost" height={46}
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28, gap: space.md },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: {
    width: 7, height: 7, backgroundColor: color.red,
    shadowColor: color.red, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  title: {
    fontFamily: font.displayBold, fontSize: 37, lineHeight: 39, color: '#FFFFFF',
    letterSpacing: 1.8, marginTop: 14,
    textShadowColor: 'rgba(255,59,92,0.6)', textShadowRadius: 24,
  },
  lede: { color: '#E4C8D0', fontSize: 15, lineHeight: 24 },
  timer: {
    fontFamily: font.displayBold, fontSize: 66, lineHeight: 70, color: '#FFFFFF',
    marginVertical: 12, textShadowColor: 'rgba(255,59,92,0.7)', textShadowRadius: 26,
  },
  steps: { gap: 9, marginTop: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 15, borderWidth: 1 },
  stepDone: { backgroundColor: color.greenDim, borderColor: color.greenBorder },
  stepActive: {
    backgroundColor: 'rgba(255,59,92,0.09)', borderColor: 'rgba(255,59,92,0.42)',
  },
  stepIdle: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,107,133,0.20)' },
  bullet: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,107,133,0.35)' },
  bulletActive: {
    borderColor: color.red,
    shadowColor: color.red, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  reassurance: {
    flexDirection: 'row', gap: 11, alignItems: 'flex-start', padding: 14,
    backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
});
