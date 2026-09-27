import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Choice, HudLabel, IconAlert, MultiChoice, Note, Screen, SystemButton, Txt, color, font, space,
} from '../../src/ui';
import { Steps } from '../../src/features/onboarding/Steps';
import { useOnboarding } from '../../src/features/onboarding/store';
import { useHunter } from '../../src/features/hunter/store';
import { useT } from '../../src/features/settings/store';
import { PARQ_KEYS, evaluateParq, type ParqKey } from '../../src/core/engine';
import { repositories } from '../../src/core/repositories';
import type { Limitation } from '../../src/core/types';
import type { TKey } from '../../src/core/i18n';

const LIMITS: Limitation[] = ['knee', 'lower_back', 'shoulder', 'wrist', 'neck'];

/**
 * R2 — triagem obrigatória. Também serve para RENOVAR (R2.8, R2.9): com
 * `?renew=1` grava direto e volta, em vez de seguir o onboarding.
 */
export default function Triagem() {
  const router = useRouter();
  const t = useT();
  const { renew } = useLocalSearchParams<{ renew?: string }>();
  const renewing = renew === '1';
  const { draft, parq, setParq, toggleLimitation, setDraft } = useOnboarding();
  const hunter = useHunter();

  const limitations = renewing && hunter.profile ? hunter.profile.limitations : draft.limitations;
  const toggle = (l: Limitation) => {
    if (renewing && hunter.profile) {
      const cur = hunter.profile.limitations;
      void hunter.saveProfile({ limitations: cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l] });
    } else {
      toggleLimitation(l);
    }
  };

  const gender = renewing ? hunter.profile?.gender : draft.gender;
  const result = evaluateParq({ answers: parq, limitations, date: hunter.today }).result;

  const yesNo = (key: ParqKey) => (
    <Choice
      value={parq[key] === true ? 'yes' : 'no'}
      onChange={(v) => setParq(key, v === 'yes')}
      tone={parq[key] ? 'red' : 'purple'}
      options={[{ value: 'yes', label: t('common.yes') }, { value: 'no', label: t('common.no') }]}
    />
  );

  const submit = async () => {
    if (renewing) {
      await repositories.screening.save(evaluateParq({ answers: parq, limitations, date: hunter.today }));
      await hunter.boot();
      router.back();
      return;
    }
    if (parq.bone_joint === false) setDraft({ limitations: [] });
    router.push('/(onboarding)/baseline');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {!renewing && (
          <Steps current={3} badge={
            <View style={styles.required}>
              <HudLabel tone="red" style={{ fontSize: 10 }}>{t('common.required')}</HudLabel>
            </View>
          } />
        )}

        <View>
          <Txt variant="title" accessibilityRole="header">{t('onboarding.screeningTitle')}</Txt>
          <Txt variant="bodySm" tone="blue" style={{ marginTop: 5, fontFamily: font.displayMedium }}>
            {t('onboarding.screeningSource')}
          </Txt>
        </View>
        <Txt variant="body" tone="dim" style={{ marginTop: -8 }}>{t('onboarding.screeningIntro')}</Txt>

        {PARQ_KEYS.map((key, i) => (
          <View key={key} style={[styles.card, parq[key] && styles.cardFlagged]}>
            <Txt variant="body" style={{ marginBottom: 11 }}>
              <Txt variant="body" tone="muted" style={{ fontFamily: font.displayMedium }}>
                {String(i + 1).padStart(2, '0')}
              </Txt>
              {'  '}{t(`parq.${key}` as TKey)}
            </Txt>
            {yesNo(key)}

            {key === 'chest_pain' && parq.chest_pain && (
              <View style={styles.followup}>
                <Txt variant="bodySm" style={{ marginBottom: 9 }}>{t('parq.chest_pain_rest')}</Txt>
                {yesNo('chest_pain_rest')}
              </View>
            )}

            {key === 'bone_joint' && parq.bone_joint && (
              <View style={styles.followup}>
                <HudLabel tone="red" style={{ fontSize: 12, marginBottom: 9 }}>{t('onboarding.screeningWhere')}</HudLabel>
                <MultiChoice tone="red" values={limitations} onToggle={toggle}
                  options={LIMITS.map((l) => ({ value: l, label: t(`limits.${l}` as TKey) }))} />
              </View>
            )}
          </View>
        ))}

        {gender !== 'male' && (
          <View style={[styles.card, parq.pregnancy && styles.cardFlagged]}>
            <Txt variant="body" style={{ marginBottom: 11 }}>{t('parq.pregnancy')}</Txt>
            {yesNo('pregnancy')}
          </View>
        )}

        {result !== 'cleared' && (
          <Note tone="red" icon={<IconAlert />}>
            <Txt variant="bodySm" tone="dim">
              {result === 'blocked'
                ? t('onboarding.blockedExplain')
                : t('onboarding.cautionExplain', { mode: t('onboarding.cautionMode') })}
            </Txt>
          </Note>
        )}

        <SystemButton label={renewing ? t('common.save') : t('common.continue')} onPress={submit} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.lg },
  required: {
    paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: 'rgba(255,59,92,0.14)', borderWidth: 1, borderColor: 'rgba(255,59,92,0.55)',
  },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, padding: 15 },
  cardFlagged: { backgroundColor: '#1C1030', borderColor: 'rgba(255,59,92,0.5)', borderLeftWidth: 3, borderLeftColor: color.red },
  followup: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,59,92,0.35)' },
});
