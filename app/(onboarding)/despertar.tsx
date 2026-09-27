import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HudLabel, IconArrow, Screen, SystemButton, Txt, color, space } from '../../src/ui';
import { useT } from '../../src/features/settings/store';

export default function Despertar() {
  const router = useRouter();
  const t = useT();

  return (
    <Screen tone="ritual">
      <View style={styles.root}>
        <View style={styles.signal}>
          <View style={styles.dot} />
          <HudLabel tone="red" style={{ fontSize: 11 }}>{t('onboarding.signalDetected')}</HudLabel>
        </View>

        <View style={styles.log} accessibilityRole="text">
          <Txt variant="bodySm" tone="muted" style={styles.mono}>&gt; {t('onboarding.analyzing')}</Txt>
          <Txt variant="bodySm" tone="muted" style={styles.mono}>
            &gt; {t('onboarding.manaCapacity')}: <Txt tone="red" style={styles.mono}>{t('onboarding.notMeasurable')}</Txt>
          </Txt>
          <Txt variant="bodySm" tone="muted" style={styles.mono}>
            &gt; {t('onboarding.provisionalRank')}: <Txt style={styles.mono}>E</Txt>
          </Txt>
          <Txt variant="bodySm" tone="blue" style={styles.mono}>&gt; {t('onboarding.weakestLine')}</Txt>
        </View>

        <View style={styles.center}>
          {/* Único lugar onde o nome aparece: trocar o nome é trocar app.name. */}
          <Txt style={styles.wordmark} accessibilityRole="header">{t('app.name').toUpperCase()}</Txt>
          <View style={styles.rule} />
          <HudLabel tone="purple" style={{ fontSize: 12 }}>{t('app.tagline')}</HudLabel>
          <Txt variant="body" tone="dim" style={styles.pitch}>
            {t('onboarding.invitation')}{'\n'}
            <Txt variant="bodyStrong">{t('onboarding.youArePlayer')}</Txt> {t('onboarding.onlyOneLevels')}
          </Txt>
        </View>

        <View style={styles.actions}>
          <SystemButton label={t('common.accept')} icon={<IconArrow />}
            onPress={() => router.push('/(onboarding)/biometria')} />
          <Txt variant="bodySm" tone="muted" style={styles.legal}>{t('onboarding.medicalDisclaimer')}</Txt>
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
