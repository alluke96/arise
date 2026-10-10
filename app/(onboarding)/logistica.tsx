import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Choice, HudLabel, IconInfo, MultiChoice, Note, Screen, SystemButton, Txt, space } from '../../src/ui';
import { Steps } from '../../src/features/onboarding/Steps';
import { useOnboarding } from '../../src/features/onboarding/store';
import { useT } from '../../src/features/settings/store';
import { WeekdayPicker } from '../../src/features/common/WeekdayPicker';
import { MAX_TRAINING_DAYS, MIN_TRAINING_DAYS } from '../../src/core/engine';
import type { Equipment, UserProfile } from '../../src/core/types';
import type { TKey } from '../../src/core/i18n';

const TIMES = ['06:30', '07:00', '12:00', '18:00', '19:00', '21:00'];
const EQUIPMENT: Equipment[] = ['band', 'dumbbell', 'pullup_bar', 'gym'];

/**
 * Passo 6 do brief — contexto e logística. Horário e local escolhidos aqui
 * são a INTENÇÃO DE IMPLEMENTAÇÃO, a técnica de mudança de comportamento com
 * maior suporte na literatura (§3.8): "vou treinar às 19h na sala".
 */
export default function Logistica() {
  const router = useRouter();
  const t = useT();
  const { draft, setDraft, toggleEquipment, trainingDays, toggleTrainingDay } = useOnboarding();
  const daysValid = trainingDays.length >= MIN_TRAINING_DAYS && trainingDays.length <= MAX_TRAINING_DAYS;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Steps current={5} onBack={() => router.back()} />
        <Txt variant="title" accessibilityRole="header">{t('onboarding.logisticsTitle')}</Txt>

        <View style={styles.block}>
          <HudLabel tone="blue">{t('onboarding.goal')}</HudLabel>
          <Choice<UserProfile['goal']> columns={2} value={draft.goal} onChange={(goal) => setDraft({ goal })}
            options={(['fat_loss', 'strength', 'health', 'habit'] as const).map((g) => ({
              value: g, label: t(`goals.${g}` as TKey),
            }))} />
        </View>

        <View style={styles.block}>
          <HudLabel tone="blue">{t('onboarding.trainingDays')}</HudLabel>
          <WeekdayPicker value={trainingDays} onToggle={toggleTrainingDay} />
          <Txt variant="bodySm" tone={daysValid ? 'muted' : 'red'}>
            {daysValid ? t('onboarding.daysNote') : t('onboarding.trainingDaysInvalid', { min: MIN_TRAINING_DAYS, max: MAX_TRAINING_DAYS })}
          </Txt>
        </View>

        <View style={styles.block}>
          <HudLabel tone="blue">{t('onboarding.sessionMinutes')}</HudLabel>
          <Choice<number> value={draft.sessionMinutes}
            onChange={(v) => setDraft({ sessionMinutes: v as UserProfile['sessionMinutes'] })}
            options={[10, 20, 30, 45].map((n) => ({ value: n, label: `${n} min` }))} />
        </View>

        <View style={styles.block}>
          <HudLabel tone="blue">{t('onboarding.preferredTime')}</HudLabel>
          <Choice<string> columns={3} value={draft.preferredTime}
            onChange={(preferredTime) => setDraft({ preferredTime })}
            options={TIMES.map((h) => ({ value: h, label: h }))} />
        </View>

        <View style={styles.block}>
          <HudLabel tone="blue">{t('onboarding.location')}</HudLabel>
          <Choice<UserProfile['location']> value={draft.location} onChange={(location) => setDraft({ location })}
            options={(['home', 'gym', 'outdoor'] as const).map((l) => ({ value: l, label: t(`locations.${l}` as TKey) }))} />
        </View>

        <Note icon={<IconInfo />}>
          <Txt variant="bodySm" tone="dim">
            {t('onboarding.intention', {
              time: draft.preferredTime,
              place: t(`locations.${draft.location}` as TKey).toLowerCase(),
            })}
          </Txt>
        </Note>

        <View style={styles.block}>
          <HudLabel tone="blue">{t('onboarding.equipment')}</HudLabel>
          <Txt variant="bodySm" tone="muted">{t('onboarding.equipmentNote')}</Txt>
          <MultiChoice values={draft.equipment.filter((e) => e !== 'none')} onToggle={toggleEquipment}
            options={EQUIPMENT.map((e) => ({ value: e, label: t(`equipment.${e}` as TKey) }))} />
        </View>

        <SystemButton label={t('common.continue')} disabled={!daysValid} onPress={() => router.push('/(onboarding)/contrato')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.xl },
  block: { gap: 10 },
});
