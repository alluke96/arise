import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Choice, HudLabel, RankBadge, Screen, SystemButton, SystemWindow, Txt, space } from '../../src/ui';
import { Steps } from '../../src/features/onboarding/Steps';
import { useOnboarding } from '../../src/features/onboarding/store';
import { useT } from '../../src/features/settings/store';
import { initialRank, type BaselineAnswers } from '../../src/core/engine';
import type { TKey } from '../../src/core/i18n';

/**
 * R3 — "Exame de Aptidão": quatro autorrelatos que definem o rank inicial,
 * entre E e C. Nunca mais que C: autorrelato não é benchmark.
 */
const QUESTIONS: { key: keyof BaselineAnswers; options: number }[] = [
  { key: 'stairs', options: 4 },
  { key: 'pushups', options: 5 },
  { key: 'walk20', options: 4 },
  { key: 'detraining', options: 5 },
];

export default function Baseline() {
  const router = useRouter();
  const t = useT();
  const { baseline, setBaseline } = useOnboarding();
  const rank = initialRank(baseline);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Steps current={4} onBack={() => router.back()} />
        <Txt variant="title" accessibilityRole="header">{t('onboarding.baselineTitle')}</Txt>
        <Txt variant="body" tone="dim" style={{ marginTop: -6 }}>{t('onboarding.baselineIntro')}</Txt>

        {QUESTIONS.map((q) => (
          <View key={q.key} style={styles.block}>
            <Txt variant="bodyStrong">{t(`baseline.${q.key}.q` as TKey)}</Txt>
            <Choice
              columns={q.options > 4 ? 3 : 2}
              value={baseline[q.key]}
              onChange={(v) => setBaseline({ [q.key]: v } as Partial<BaselineAnswers>)}
              options={Array.from({ length: q.options }, (_, i) => ({
                value: i, label: t(`baseline.${q.key}.o${i}` as TKey),
              }))}
            />
          </View>
        ))}

        <SystemWindow padding={16}>
          <View style={styles.result}>
            <RankBadge rank={rank} size="sm" />
            <View style={{ flex: 1 }}>
              <HudLabel tone="blue">{t('onboarding.provisionalRank')}</HudLabel>
              <Txt variant="bodySm" tone="dim" style={{ marginTop: 4 }}>{t('onboarding.baselineNote')}</Txt>
            </View>
          </View>
        </SystemWindow>

        <SystemButton label={t('common.continue')} onPress={() => router.push('/(onboarding)/logistica')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.lg },
  block: { gap: 10 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
