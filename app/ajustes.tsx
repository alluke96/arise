import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconBack, IconInfo, IconLock, Screen, SystemButton, Txt,
  color, font, space,
} from '../src/ui';
import { useSettings, useSystemText, useT } from '../src/features/settings/store';
import { useProgression } from '../src/features/progression/store';
import { LOCALES, LOCALE_LABEL, formatLength, formatMass } from '../src/core/i18n';
import { buildBundle, serializeBundle, suggestedFileName } from '../src/core/db/backup';
import { repositories } from '../src/core/repositories';
import { INITIAL_STATUS, statusLabel } from '../src/core/sync/queue';

export default function Ajustes() {
  const router = useRouter();
  const t = useT();
  const sys = useSystemText();
  const { profile } = useProgression();
  const {
    locale, tone, units, notifications,
    setLocale, setTone, setUnits, setNotifications,
  } = useSettings();
  const [exporting, setExporting] = useState(false);

  const sync = statusLabel(INITIAL_STATUS);

  const onExport = async () => {
    setExporting(true);
    try {
      const bundle = await buildBundle(repositories);
      const json = serializeBundle(bundle);
      Alert.alert(
        suggestedFileName(),
        `${bundle.events.length} eventos · ${Math.round(json.length / 1024)} KB\n\n` +
        t('settings.exportNote'),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')}
            onPress={() => router.back()} hitSlop={12}>
            <IconBack />
          </Pressable>
          <Txt variant="title" style={{ fontSize: 20 }}>{t('settings.title')}</Txt>
        </View>

        <Section label={t('settings.systemTone')}>
          <Segmented
            options={[
              { value: 'cold' as const, label: t('settings.toneCold') },
              { value: 'companion' as const, label: t('settings.toneCompanion') },
            ]}
            value={tone}
            onChange={setTone}
          />
          <Note>{t('settings.toneNote')}</Note>
          <View style={styles.preview}>
            <HudLabel tone="muted" style={{ fontSize: 10, marginBottom: 6 }}>Prévia</HudLabel>
            <Txt variant="bodySm" tone={tone === 'cold' ? 'blue' : 'default'}>
              {sys('questAvailable')}
            </Txt>
          </View>
        </Section>

        <Section label={t('settings.language')}>
          <Segmented
            options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABEL[l] }))}
            value={locale}
            onChange={setLocale}
          />
        </Section>

        <Section label={t('settings.units')}>
          <View style={styles.row}>
            <Segmented
              options={[{ value: 'kg' as const, label: 'kg' }, { value: 'lb' as const, label: 'lb' }]}
              value={units.mass}
              onChange={(mass) => setUnits({ mass })}
            />
            <Segmented
              options={[{ value: 'cm' as const, label: 'cm' }, { value: 'ft' as const, label: 'ft/in' }]}
              value={units.length}
              onChange={(length) => setUnits({ length })}
            />
          </View>
          <View style={styles.preview}>
            <Txt variant="bodySm" tone="dim">
              {formatMass(profile.weightKg, units.mass, locale)} ·{' '}
              {formatLength(profile.heightCm, units.length, locale)}
            </Txt>
          </View>
          <Note>{t('settings.unitsNote')}</Note>
        </Section>

        <Section label={t('settings.notifications')}>
          <Toggle label="Missão disponível" value={notifications.questAvailable}
            onChange={(questAvailable) => setNotifications({ questAvailable })} />
          <Toggle label="Avisos de prazo" value={notifications.deadlineWarnings}
            onChange={(deadlineWarnings) => setNotifications({ deadlineWarnings })} />
          <Note>No máximo 3 por dia, sempre.</Note>
        </Section>

        <Section label={t('settings.subscription')}>
          <Row label="Estado" value="Teste grátis · 2 dias restantes" />
          <SystemButton label="Ver planos" variant="ghost" height={46}
            onPress={() => router.push('/paywall')} />
        </Section>

        {/* Decisão #5: nutrição fora do MVP, mas visível e honestamente rotulada.
            Entrada bloqueada comunica roadmap sem prometer data — e sem coletar
            e-mail para "avisar quando sair", que viraria obrigação. */}
        <Section label={t('settings.nutrition')}>
          <View style={styles.soon}>
            <IconLock size={18} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" tone="locked">{t('common.soon')}…</Txt>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 3 }}>
                {t('settings.nutritionSoon')}
              </Txt>
            </View>
          </View>
        </Section>

        <Section label={t('settings.privacy')}>
          <Row label="Sincronização" value={sync === 'synced' ? 'Em dia' : sync} />
          <SystemButton
            label={exporting ? '…' : t('settings.exportData')}
            variant="blue" height={46} onPress={onExport} disabled={exporting}
          />
          <SystemButton label={t('settings.importData')} variant="ghost" height={46} />
          <View style={styles.note}>
            <IconInfo />
            <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
              {t('settings.exportNote')}
            </Txt>
          </View>
        </Section>

        <SystemButton label={t('settings.deleteAccount')} variant="danger" height={50}
          onPress={() => Alert.alert(
            t('settings.deleteAccount'),
            'Isso apaga todo o seu histórico neste aparelho. Exporte antes se quiser guardar.',
          )} />
      </ScrollView>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <HudLabel tone="muted">{label}</HudLabel>
      {children}
    </View>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on ? styles.segmentOn : styles.segmentOff]}
          >
            <Txt variant="bodySm" tone={on ? 'default' : 'dim'}
              numberOfLines={1} style={{ fontFamily: font.displayMedium, fontSize: 13 }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function Toggle({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Txt variant="body" style={{ flex: 1 }}>{label}</Txt>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: color.track, true: color.purple }}
        thumbColor={value ? color.purpleSoft : color.textMuted}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.toggleRow}>
      <Txt variant="body" tone="dim" style={{ flex: 1 }}>{label}</Txt>
      <Txt variant="bodySm">{value}</Txt>
    </View>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>{children}</Txt>;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  section: { gap: space.sm },
  row: { flexDirection: 'row', gap: 10 },
  segmented: { flexDirection: 'row', gap: 8, flex: 1 },
  segment: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingHorizontal: 8 },
  segmentOn: { backgroundColor: color.purple, borderColor: color.purpleLight },
  segmentOff: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 },
  preview: { padding: 12, backgroundColor: color.surface, borderLeftWidth: 2, borderLeftColor: color.blue },
  soon: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: color.surfaceAlt, borderWidth: 1, borderColor: 'rgba(139,92,246,0.18)',
  },
  note: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12,
    backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
});
