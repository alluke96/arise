import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Choice, HudLabel, IconInfo, Note, Screen, Stepper, SystemButton, SystemWindow, Txt, color, font, space,
} from '../../src/ui';
import { useOnboarding } from '../../src/features/onboarding/store';
import { Steps } from '../../src/features/onboarding/Steps';
import { useT } from '../../src/features/settings/store';

export default function Biometria() {
  const router = useRouter();
  const t = useT();
  const { draft, setDraft } = useOnboarding();

  // R1.7/R1.8 — faixas válidas; menores de 16 bloqueados.
  const ageValid = draft.age >= 16 && draft.age <= 90;
  const nameValid = draft.hunterName.trim().length >= 3;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Steps current={2} onBack={() => router.back()} />

        <Txt variant="title" accessibilityRole="header">{t('onboarding.registryTitle')}</Txt>
        <Txt variant="body" tone="dim" style={{ marginTop: -6 }}>{t('onboarding.registrySubtitle')}</Txt>

        <View>
          <HudLabel tone="blue" style={styles.label} nativeID="nameLabel">{t('onboarding.hunterName')}</HudLabel>
          <View style={styles.input}>
            <TextInput
              accessibilityLabelledBy="nameLabel"
              accessibilityLabel={t('onboarding.hunterName')}
              value={draft.hunterName}
              onChangeText={(v) => setDraft({ hunterName: v.slice(0, 20) })}
              placeholder={t('onboarding.hunterNamePlaceholder')}
              placeholderTextColor={color.textMuted}
              autoCapitalize="characters"
              style={styles.inputText}
            />
          </View>
        </View>

        <SystemWindow padding={14} glow={false}>
          <Stepper label={t('onboarding.age')} value={draft.age} min={10} max={90}
            onChange={(age) => setDraft({ age })}
            decLabel={t('onboarding.decreaseAge')} incLabel={t('onboarding.increaseAge')} />
        </SystemWindow>
        {!ageValid && <Note tone="red"><Txt variant="bodySm" tone="red">{t('onboarding.minimumAge')}</Txt></Note>}
        {ageValid && draft.age < 18 && (
          <Note><Txt variant="bodySm" tone="dim">{t('onboarding.minorNotice')}</Txt></Note>
        )}

        <View>
          <HudLabel tone="blue" style={styles.label}>{t('onboarding.gender')}</HudLabel>
          <Choice
            value={draft.gender}
            onChange={(gender) => setDraft({ gender })}
            options={[
              { value: 'male', label: t('onboarding.genderMale') },
              { value: 'female', label: t('onboarding.genderFemale') },
              { value: 'unspecified', label: t('onboarding.genderUnspecified') },
            ]}
          />
          {draft.gender === 'unspecified' && (
            <Txt variant="bodySm" tone="muted" style={{ marginTop: 8 }}>{t('onboarding.genderUnspecifiedNote')}</Txt>
          )}
        </View>

        <SystemWindow padding={14} glow={false}>
          <View style={{ gap: 12 }}>
            <Stepper label={t('onboarding.weight')} value={draft.weightKg} min={30} max={300} step={0.5}
              suffix="kg" onChange={(weightKg) => setDraft({ weightKg })}
              decLabel={t('common.decrease')} incLabel={t('common.increase')} />
            <Stepper label={t('onboarding.height')} value={draft.heightCm} min={120} max={250}
              suffix="cm" onChange={(heightCm) => setDraft({ heightCm })}
              decLabel={t('common.decrease')} incLabel={t('common.increase')} />
            <Stepper label={`${t('onboarding.waist')} · ${t('common.optional')}`} value={draft.waistCm ?? 0}
              min={0} max={200} suffix="cm"
              onChange={(v) => setDraft({ waistCm: v > 0 ? v : null })}
              decLabel={t('common.decrease')} incLabel={t('common.increase')} />
          </View>
        </SystemWindow>
        <Txt variant="bodySm" tone="muted" style={{ marginTop: -8 }}>{t('onboarding.waistNote')}</Txt>

        <Note icon={<IconInfo />}>
          <Txt variant="bodySm" tone="dim">{t('onboarding.dataStaysLocal')}</Txt>
        </Note>

        <SystemButton label={t('common.continue')} disabled={!ageValid || !nameValid}
          onPress={() => router.push('/(onboarding)/triagem')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.lg },
  label: { fontSize: 12, marginBottom: 9 },
  input: {
    height: 52, paddingHorizontal: 14, justifyContent: 'center',
    backgroundColor: color.surfaceRaised, borderWidth: 1, borderColor: color.purpleBorder,
  },
  inputText: { color: color.text, fontSize: 20, fontFamily: font.displayMedium, letterSpacing: 2 },
});
