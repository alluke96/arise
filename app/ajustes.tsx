import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Choice, Header, HudLabel, IconInfo, IconLock, Note, Row, Screen, Section, SystemButton,
  Toggle, Txt, color, space,
} from '../src/ui';
import { useLocale, useSettings, useSystemText, useT } from '../src/features/settings/store';
import { useHunter } from '../src/features/hunter/store';
import { useBilling } from '../src/features/billing/store';
import { exportToFile, importFromFile } from '../src/features/backup/files';
import { syncNotifications } from '../src/features/notifications/adapter';
import { LOCALES, LOCALE_LABEL, formatLength, formatMass, type TKey } from '../src/core/i18n';
import type { NotificationPrefs } from '../src/core/notifications/schedule';
import { TEST_BUILD } from '../src/core/config';
import { useAuth } from '../src/features/auth/store';

export default function Ajustes() {
  const router = useRouter();
  const t = useT();
  const sys = useSystemText();
  const locale = useLocale();
  const tone = useSettings((s) => s.tone);
  const units = useSettings((s) => s.units);
  const notifications = useSettings((s) => s.notifications);
  const { setLocale, setTone, setUnits, setNotifications } = useSettings.getState();
  const h = useHunter();
  const entitlement = useBilling((s) => s.entitlement);
  const subscription = useBilling((s) => s.subscription);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  useEffect(() => { void useBilling.getState().refresh(h.startedAt); }, [h.startedAt]);

  if (!h.profile) return <Screen><View /></Screen>;
  const profile = h.profile;
  const injured = h.streak?.state === 'injured';

  const updateNotifications = (p: Partial<NotificationPrefs>) => {
    setNotifications(p);
    if (h.quest) void syncNotifications(h.quest, profile.preferredTime);
  };

  const subscriptionLabel = (() => {
    if (!entitlement) return '…';
    switch (entitlement.state) {
      case 'trial': return t('settings.subTrial', { days: entitlement.trialDaysLeft });
      case 'subscribed': return t(subscription?.plan === 'monthly' ? 'settings.subMonthly' : 'settings.subAnnual');
      case 'grace': return t('settings.subGrace', { hours: entitlement.graceHoursLeft });
      default: return t('settings.subLocked');
    }
  })();

  const onExport = async () => {
    setBusy('export');
    try {
      const r = await exportToFile();
      Alert.alert(t('settings.exportDone'), t('settings.exportSummary', {
        events: r.events, kb: Math.max(1, Math.round(r.bytes / 1024)),
      }));
    } catch {
      Alert.alert(t('settings.exportData'), t('settings.fileError'));
    } finally {
      setBusy(null);
    }
  };

  const onImport = async () => {
    setBusy('import');
    try {
      const report = await importFromFile();
      if (!report) return;
      await h.boot();
      await useSettings.getState().hydrate(useHunter.getState().profile, locale);
      Alert.alert(t('settings.importDone'), t('settings.importSummary', {
        events: report.events, quests: report.quests,
      }));
    } catch (e) {
      Alert.alert(t('settings.importData'), `${t('settings.importInvalid')}\n\n${e instanceof Error ? e.message : ''}`);
    } finally {
      setBusy(null);
    }
  };

  const onInjury = (value: boolean) => {
    Alert.alert(
      t(value ? 'settings.injuryOnTitle' : 'settings.injuryOffTitle'),
      t(value ? 'settings.injuryOnBody' : 'settings.injuryOffBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => void h.setInjured(value) },
      ],
    );
  };

  const onWipe = () => {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAction'), style: 'destructive',
        onPress: async () => {
          await h.wipe();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title={t('settings.title')} onBack={() => router.back()} backLabel={t('common.back')} />

        <Section label={t('settings.systemTone')}>
          <Choice
            options={[
              { value: 'cold' as const, label: t('settings.toneCold') },
              { value: 'companion' as const, label: t('settings.toneCompanion') },
            ]}
            value={tone}
            onChange={setTone}
          />
          <Txt variant="bodySm" tone="muted">{t('settings.toneNote')}</Txt>
          <View style={styles.preview}>
            <HudLabel tone="muted" style={{ fontSize: 10, marginBottom: 6 }}>{t('settings.preview')}</HudLabel>
            <Txt variant="bodySm" tone={tone === 'cold' ? 'blue' : 'default'}>{sys('questAvailable')}</Txt>
          </View>
        </Section>

        <Section label={t('settings.language')}>
          <Choice
            options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABEL[l] }))}
            value={locale}
            onChange={setLocale}
          />
        </Section>

        <Section label={t('settings.units')}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Choice
                options={[{ value: 'kg' as const, label: 'kg' }, { value: 'lb' as const, label: 'lb' }]}
                value={units.mass}
                onChange={(mass) => setUnits({ mass })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Choice
                options={[{ value: 'cm' as const, label: 'cm' }, { value: 'ft' as const, label: 'ft/in' }]}
                value={units.length}
                onChange={(length) => setUnits({ length })}
              />
            </View>
          </View>
          <View style={styles.preview}>
            <Txt variant="bodySm" tone="dim">
              {formatMass(profile.weightKg, units.mass, locale)} · {formatLength(profile.heightCm, units.length, locale)}
            </Txt>
          </View>
          <Txt variant="bodySm" tone="muted">{t('settings.unitsNote')}</Txt>
        </Section>

        <Section label={t('settings.notifications')}>
          <Toggle label={t('settings.notifEnabled')} value={notifications.enabled}
            onChange={(enabled) => updateNotifications({ enabled })} />
          {notifications.enabled && (
            <>
              <Toggle label={t('settings.notifQuest')} value={notifications.questAvailable}
                note={t('settings.notifQuestNote', { time: profile.preferredTime })}
                onChange={(questAvailable) => updateNotifications({ questAvailable })} />
              <Toggle label={t('settings.notifDeadline')} value={notifications.deadlineWarnings}
                onChange={(deadlineWarnings) => updateNotifications({ deadlineWarnings })} />
              <Toggle label={t('settings.notifCompletion')} value={notifications.completion}
                onChange={(completion) => updateNotifications({ completion })} />
            </>
          )}
          <Txt variant="bodySm" tone="muted">{t('settings.notifCap')}</Txt>
        </Section>

        <Section label={t('settings.health')}>
          <Toggle label={t('settings.injury')} value={injured} note={t('settings.injuryNote')}
            onChange={onInjury} />
          <Row label={t('settings.screeningResult')}
            value={h.screening ? t(`settings.screening.${h.screening.result}` as TKey) : '—'} />
          <SystemButton label={t('status.redoScreening')} variant="ghost" height={46}
            onPress={() => router.push('/(onboarding)/triagem?renew=1')} />
        </Section>

        <Section label={t('settings.subscription')}>
          <Row label={t('settings.subState')} value={subscriptionLabel} />
          <SystemButton label={t('settings.seePlans')} variant="ghost" height={46}
            onPress={() => router.push('/paywall')} />
        </Section>

        {/* Decisão #5: nutrição fora do MVP, mas visível e honestamente rotulada. */}
        <Section label={t('settings.nutrition')}>
          <View style={styles.soon} accessibilityState={{ disabled: true }}>
            <IconLock size={18} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" tone="locked">{t('common.soon')}…</Txt>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 3 }}>{t('settings.nutritionSoon')}</Txt>
            </View>
          </View>
        </Section>

        <Section label={t('settings.privacy')}>
          <Row label={t('settings.sync')} value={t('settings.syncLocal')} />
          <SystemButton label={busy === 'export' ? '…' : t('settings.exportData')}
            variant="blue" height={46} onPress={onExport} disabled={busy !== null} />
          <SystemButton label={busy === 'import' ? '…' : t('settings.importData')}
            variant="ghost" height={46} onPress={onImport} disabled={busy !== null} />
          <Note icon={<IconInfo />}>
            <Txt variant="bodySm" tone="dim">{t('settings.exportNote')}</Txt>
          </Note>
        </Section>

        {TEST_BUILD && (
          <Section label={t('lab.title')}>
            <SystemButton label={t('lab.open')} variant="blue" height={46}
              onPress={() => router.push('/laboratorio')} />
            <SystemButton label={t('auth.logout')} variant="ghost" height={46}
              onPress={async () => { await useAuth.getState().logout(); router.replace('/login'); }} />
          </Section>
        )}

        <SystemButton label={t('settings.deleteAccount')} variant="danger" height={50} onPress={onWipe} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: space.xl },
  row: { flexDirection: 'row', gap: 10 },
  preview: { padding: 12, backgroundColor: color.surface, borderLeftWidth: 2, borderLeftColor: color.blue },
  soon: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: color.surfaceAlt, borderWidth: 1, borderColor: 'rgba(139,92,246,0.18)',
  },
});
