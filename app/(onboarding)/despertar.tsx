import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { showAlert } from '../../src/ui/alert';
import { useRouter } from 'expo-router';
import { HudLabel, IconArrow, Screen, SystemButton, Txt, color, space } from '../../src/ui';
import { useSettings, useT } from '../../src/features/settings/store';
import { useHunter } from '../../src/features/hunter/store';
import { importFromFile } from '../../src/features/backup/files';
import {
  INTRO_ACTIONS_FADE_MS, INTRO_DOT_MS, INTRO_WORDMARK_FADE_MS, linePauseMs,
  thinkingSteps, type ThinkingStep,
} from '../../src/features/onboarding/intro';

const native = Platform.OS !== 'web';

export default function Despertar() {
  const router = useRouter();
  const t = useT();
  const [restoring, setRestoring] = useState(false);
  // Já cadastrado (veio do Lab, "Rever a abertura"): só assiste e volta.
  const replay = useHunter((st) => !!st.profile && !!st.startedAt);

  // ── Abertura animada ────────────────────────────────────────────────────
  // As linhas do terminal "pensam" uma a uma; depois o ARISE surge num fade
  // lento, o convite pisca como um holograma ligando e os botões aparecem.
  // Tocar na tela pula tudo; "Reduzir movimento" mostra tudo direto.
  const LINES: { label: string; value: string; tone: 'muted' | 'blue'; valueTone: 'muted' | 'red' | 'default' | 'blue' }[] = [
    { label: t('onboarding.analyzing').replace(/(…|\.\.\.)$/, ''), value: '...', tone: 'muted', valueTone: 'muted' },
    { label: `${t('onboarding.manaCapacity')}: `, value: t('onboarding.notMeasurable'), tone: 'muted', valueTone: 'red' },
    { label: `${t('onboarding.provisionalRank')}: `, value: 'E', tone: 'muted', valueTone: 'default' },
    { label: '', value: t('onboarding.weakestLine'), tone: 'blue', valueTone: 'blue' },
  ];
  const [done, setDone] = useState(0);
  const [thinking, setThinking] = useState<ThinkingStep | null>(null);
  const [actionsReady, setActionsReady] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;
  const wordmark = useRef(new Animated.Value(0)).current;
  const pitch = useRef(new Animated.Value(0)).current;
  const actions = useRef(new Animated.Value(0)).current;
  const finished = useRef(false);

  /** Mostra tudo de uma vez (toque para pular, ou "Reduzir movimento"). */
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    [wordmark, pitch, actions].forEach((v) => { v.stopAnimation(); v.setValue(1); });
    setThinking(null);
    setDone(LINES.length);
    setActionsReady(true);
  };

  useEffect(() => {
    // "Sinal detectado" pisca sem parar.
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0.15, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      Animated.timing(blink, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
    ]));
    loop.start();

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => { timers.push(setTimeout(r, ms)); });
    const stop = () => cancelled || finished.current;

    (async () => {
      if (await AccessibilityInfo.isReduceMotionEnabled().catch(() => false)) return finish();
      const steps = thinkingSteps(LINES.length);
      for (let i = 0; i < steps.length; i++) {
        if (stop()) return;
        setThinking(steps[i]);
        await wait(INTRO_DOT_MS);
        if (steps[i + 1]?.line !== steps[i].line) {
          if (stop()) return;
          setThinking(null);
          setDone(steps[i].line + 1);
          await wait(linePauseMs(steps[i].line, LINES.length));
        }
      }
      if (stop()) return;
      Animated.sequence([
        Animated.timing(wordmark, {
          toValue: 1, duration: INTRO_WORDMARK_FADE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: native,
        }),
        // O convite liga como um holograma: algumas piscadas e fica.
        ...[1, 0.1, 1, 0.25, 0.9, 0.4, 1].map((toValue, k) =>
          Animated.timing(pitch, { toValue, duration: k === 6 ? 220 : 70, useNativeDriver: native })),
      ]).start(({ finished: ok }) => {
        if (!ok || stop()) return;
        setActionsReady(true);
        Animated.timing(actions, {
          toValue: 1, duration: INTRO_ACTIONS_FADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: native,
        }).start(() => { finished.current = true; });
      });
    })();

    return () => { cancelled = true; loop.stop(); timers.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Celular novo: traz o histórico de volta sem refazer o onboarding. */
  const restore = async () => {
    setRestoring(true);
    try {
      const report = await importFromFile();
      if (!report) return;
      if (!report.profileRestored) {
        showAlert(t('settings.importData'), t('onboarding.restoreNoProfile'));
        return;
      }
      await useHunter.getState().boot();
      await useSettings.getState().hydrate(useHunter.getState().profile, useSettings.getState().locale);
      showAlert(t('settings.importDone'), t('settings.importSummary', { events: report.events, quests: report.quests }));
      router.replace('/');
    } catch (e) {
      showAlert(t('settings.importData'), `${t('settings.importInvalid')}\n\n${e instanceof Error ? e.message : ''}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen tone="ritual">
      <View style={styles.root}>
        <Pressable accessibilityHint={t('onboarding.introSkip')} onPress={finish} style={{ flex: 1 }}>
          <Animated.View style={[styles.signal, { opacity: blink }]}>
            <View style={styles.dot} />
            <HudLabel tone="red" style={{ fontSize: 11 }}>{t('onboarding.signalDetected')}</HudLabel>
          </Animated.View>

          <View style={styles.log} accessibilityRole="text">
            {LINES.map((line, i) => {
              const shown = i < done;
              const isThinking = thinking?.line === i;
              return (
                // Linha ainda não chegou: renderizada invisível, para o layout
                // não pular quando ela aparecer.
                <Txt key={i} variant="bodySm" tone={line.tone}
                  style={[styles.mono, { opacity: shown || isThinking ? 1 : 0 }]}>
                  &gt; {line.label}
                  {shown
                    ? <Txt variant="bodySm" tone={line.valueTone} style={styles.mono}>{line.value}</Txt>
                    : isThinking ? '.'.repeat(thinking!.dots) : line.value}
                </Txt>
              );
            })}
          </View>

          <View style={styles.center}>
            <Animated.View style={{
              alignItems: 'center', gap: 14, opacity: wordmark,
              transform: [{ translateY: wordmark.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}>
              {/* Único lugar onde o nome aparece: trocar o nome é trocar app.name. */}
              <Txt style={styles.wordmark} accessibilityRole="header">{t('app.name').toUpperCase()}</Txt>
              <View style={styles.rule} />
              <HudLabel tone="purple" style={{ fontSize: 12 }}>{t('app.tagline')}</HudLabel>
            </Animated.View>
            <Animated.View style={{ opacity: pitch }}>
              <Txt variant="body" tone="dim" style={styles.pitch}>
                {t('onboarding.invitation')}{'\n'}
                <Txt variant="bodyStrong">{t('onboarding.youArePlayer')}</Txt> {t('onboarding.onlyOneLevels')}
              </Txt>
            </Animated.View>
          </View>
        </Pressable>

        <Animated.View style={[styles.actions, { opacity: actions }]} pointerEvents={actionsReady ? 'auto' : 'none'}>
          <SystemButton label={t('common.accept')} icon={<IconArrow />}
            onPress={() => (replay ? router.back() : router.push('/(onboarding)/biometria'))} />
          {!replay && (
            <SystemButton label={restoring ? '…' : t('onboarding.restoreBackup')} variant="ghost" height={52}
              disabled={restoring} onPress={restore} />
          )}
          <Txt variant="bodySm" tone="muted" style={styles.legal}>{t('onboarding.medicalDisclaimer')}</Txt>
        </Animated.View>
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
    fontFamily: 'ChakraPetch_700Bold', fontSize: 56, lineHeight: 68, color: '#FFFFFF',
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
