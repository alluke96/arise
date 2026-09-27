import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconCheck, IconInfo, Screen, SystemButton, SystemWindow, Txt,
  color, font, space,
} from '../src/ui';
import { useT } from '../src/features/settings/store';
import { PLANS, TRIAL_DAYS, annualSavingPercent } from '../src/core/billing/entitlement';
import { formatNumber } from '../src/core/i18n';

const INCLUDED = [
  'Missão Diária calibrada ao seu nível',
  'Jornada completa do Rank E ao Rank S',
  '80 exercícios com escada de progressão',
  'Zona de Penalidade e Pedras de Recuperação',
  'Exército de Sombras com 40 conquistas',
];

export default function Paywall() {
  const router = useRouter();
  const t = useT();
  // R13.4 — o anual já vem selecionado.
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const saving = annualSavingPercent();
  const selected = PLANS.find((p) => p.id === plan)!;

  return (
    <Screen tone="ritual">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <HudLabel tone="blue">{t('billing.trialTitle')}</HudLabel>
          <Txt variant="title" style={styles.title}>
            Você saiu do Rank E.{'\n'}Continue subindo.
          </Txt>
        </View>

        <SystemWindow padding={18}>
          {INCLUDED.map((line) => (
            <View key={line} style={styles.includedRow}>
              <IconCheck size={15} />
              <Txt variant="bodySm" style={{ flex: 1 }}>{line}</Txt>
            </View>
          ))}
        </SystemWindow>

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const on = p.id === plan;
            const isAnnual = p.id === 'annual';
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t(isAnnual ? 'billing.annual' : 'billing.monthly')}, R$ ${p.priceBRL}`}
                onPress={() => setPlan(p.id)}
                style={[styles.plan, on ? styles.planOn : styles.planOff]}
              >
                <View style={styles.planHead}>
                  <Txt variant="bodyStrong" tone={on ? 'default' : 'dim'}>
                    {t(isAnnual ? 'billing.annual' : 'billing.monthly')}
                  </Txt>
                  {isAnnual && (
                    <View style={styles.badge}>
                      <Txt variant="bodySm" tone="blue" style={styles.badgeText}>
                        {t('billing.save', { percent: saving })}
                      </Txt>
                    </View>
                  )}
                </View>
                <Txt variant="stat" tone={on ? 'default' : 'locked'} style={{ fontSize: 24 }}>
                  R$ {formatNumber(p.priceBRL, 'pt-BR', 2)}
                  <Txt variant="bodySm" tone="muted" style={{ fontSize: 13 }}>
                    {t(isAnnual ? 'billing.perYear' : 'billing.perMonth')}
                  </Txt>
                </Txt>
              </Pressable>
            );
          })}
        </View>

        {/* R13.6 — divulgação obrigatória na PRÓPRIA tela, não só nos termos. */}
        <Txt variant="bodySm" tone="dim" style={styles.disclosure}>
          {t('billing.trialDisclosure', {
            days: TRIAL_DAYS,
            price: `R$ ${formatNumber(selected.priceBRL, 'pt-BR', 2)}`,
            period: t(plan === 'annual' ? 'billing.perYear' : 'billing.perMonth'),
          })}
        </Txt>

        <SystemButton label={t('common.continue')} height={58} onPress={() => router.back()} />
        <SystemButton label={t('billing.restore')} variant="ghost" height={46}
          onPress={() => router.back()} />

        {/* R13.11 — em texto normal, não em letra miúda. */}
        <View style={styles.dataNotice}>
          <IconInfo />
          <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>{t('billing.dataNotice')}</Txt>
        </View>

        <Txt variant="bodySm" tone="muted" style={styles.stillAvailable}>
          {t('billing.stillAvailable')}
        </Txt>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 44, gap: space.lg },
  head: { gap: 8, marginTop: 8 },
  title: { fontSize: 24, lineHeight: 31, fontFamily: font.display },
  includedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  plans: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, padding: 14, borderWidth: 1, gap: 8, minHeight: 96, justifyContent: 'center' },
  planOn: {
    backgroundColor: color.purpleDim, borderColor: color.purpleLight,
    shadowColor: color.purple, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  planOff: { backgroundColor: color.surfaceAlt, borderColor: color.purpleBorder },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: color.blueDim, borderWidth: 1, borderColor: color.blueBorder },
  badgeText: { fontSize: 10, fontFamily: font.displayMedium },
  disclosure: { textAlign: 'center', lineHeight: 18 },
  dataNotice: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13,
    backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
  stillAvailable: { textAlign: 'center' },
});
