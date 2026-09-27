import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Choice, HudLabel, IconInfo, IconLock, IconShield, Note, Screen, StatBar, SystemWindow, Txt,
  color, space,
} from '../../src/ui';
import { useHunter } from '../../src/features/hunter/store';
import { useLocale, useT } from '../../src/features/settings/store';
import { GRADE_ORDER, SHADOWS, shadowText } from '../../src/data/shadows';
import { SHADOW_RULES } from '../../src/data/shadowRules';
import type { TKey } from '../../src/core/i18n';
import type { Shadow } from '../../src/core/types';

type Grade = Shadow['grade'];

const GRADE_ACCENT: Record<Grade, string> = {
  soldier: color.blue, elite: color.purpleSoft, knight: color.redText,
  commander: color.redText, marshal: color.gold, general: color.gold,
};

type Filter = 'all' | 'unlocked' | 'locked';

export default function ExercitoScreen() {
  const t = useT();
  const locale = useLocale();
  const { unlockedShadows, shadowProgress } = useHunter();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);

  const unlocked = useMemo(() => new Set(unlockedShadows), [unlockedShadows]);

  // Próxima sombra: a disponível mais perto de sair, desempate pela ordem de grau.
  const next = useMemo(() => {
    const candidates = SHADOWS.filter((s) =>
      !unlocked.has(s.id) && SHADOW_RULES[s.id]?.kind !== 'unavailable');
    return candidates.sort((a, b) =>
      (shadowProgress[b.id] ?? 0) - (shadowProgress[a.id] ?? 0)
      || GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade))[0];
  }, [unlocked, shadowProgress]);

  const visible = SHADOWS.filter((s) =>
    filter === 'all' || (filter === 'unlocked') === unlocked.has(s.id));

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Txt variant="title">{t('army.title')}</Txt>
          <Txt variant="bodySm" tone="dim" style={{ marginTop: 4 }}>
            {t('army.count', { unlocked: unlocked.size, total: SHADOWS.length })}
          </Txt>
        </View>

        {next && (
          <SystemWindow variant="rare" padding={16}>
            <View style={styles.nextRow}>
              <View style={styles.nextIcon}>
                <IconShield size={26} c={GRADE_ACCENT[next.grade]} />
              </View>
              <View style={{ flex: 1 }}>
                <HudLabel tone="gold" style={{ fontSize: 10 }}>
                  {t('army.next', { grade: t(`army.grades.${next.grade}` as TKey) })}
                </HudLabel>
                <Txt variant="bodyStrong" style={{ marginVertical: 5 }}>{shadowText(next, locale).name}</Txt>
                <StatBar ratio={shadowProgress[next.id] ?? 0} height={4} fill={color.gold} glow={false} />
                <Txt variant="bodySm" tone="muted" style={{ marginTop: 6 }}>
                  {shadowText(next, locale).condition} · {Math.floor((shadowProgress[next.id] ?? 0) * 100)}%
                </Txt>
              </View>
            </View>
          </SystemWindow>
        )}

        <Choice<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('army.filterAll') },
            { value: 'unlocked', label: t('army.filterUnlocked') },
            { value: 'locked', label: t('army.filterLocked') },
          ]}
        />

        {visible.length === 0 && (
          <Txt variant="bodySm" tone="muted">{t('army.empty')}</Txt>
        )}

        <View style={styles.grid}>
          {visible.map((s) => {
            const on = unlocked.has(s.id);
            const rule = SHADOW_RULES[s.id];
            const unavailable = rule?.kind === 'unavailable';
            const accent = on ? GRADE_ACCENT[s.grade] : color.textLocked;
            const text = shadowText(s, locale);
            const progress = shadowProgress[s.id] ?? 0;
            return (
              <View key={s.id} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open === s.id }}
                  accessibilityLabel={`${text.name}, ${t(`army.grades.${s.grade}` as TKey)}, ${
                    on ? t('army.unlocked') : unavailable ? t('army.unavailable') : `${Math.floor(progress * 100)}%`}`}
                  onPress={() => setOpen(open === s.id ? null : s.id)}
                  style={[
                    styles.card,
                    { borderColor: on ? accent : 'rgba(139,92,246,0.18)' },
                    on && { shadowColor: accent, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
                    !on && { backgroundColor: color.surfaceAlt },
                  ]}
                >
                  {on ? <IconShield c={accent} /> : <IconLock size={26} />}
                  <Txt variant="bodySm" tone={on ? 'default' : 'locked'} numberOfLines={1} style={styles.cardName}>
                    {text.name}
                  </Txt>
                  <Txt variant="hudSmall" tone={on ? 'blue' : 'locked'} style={{ fontSize: 10 }}>
                    {t(`army.grades.${s.grade}` as TKey)}
                  </Txt>
                  {!on && !unavailable && progress > 0 && (
                    <View style={styles.cardBar}><StatBar ratio={progress} height={2} glow={false} /></View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        {open && (() => {
          const s = SHADOWS.find((x) => x.id === open)!;
          const text = shadowText(s, locale);
          const on = unlocked.has(s.id);
          const unavailable = SHADOW_RULES[s.id]?.kind === 'unavailable';
          return (
            <SystemWindow padding={16}>
              <HudLabel tone={on ? 'blue' : 'muted'}>{text.name}</HudLabel>
              <Txt variant="bodySm" tone="dim" style={{ marginTop: 8 }}>
                <Txt variant="bodySm" tone="muted">{t('army.condition')}: </Txt>{text.condition}
              </Txt>
              <Txt variant="bodySm" tone="dim" style={{ marginTop: 4 }}>
                <Txt variant="bodySm" tone="muted">{t('army.perk')}: </Txt>{text.perk}
              </Txt>
              {unavailable && (
                <Txt variant="bodySm" tone="red" style={{ marginTop: 8 }}>
                  {t(`army.unavailableReason.${s.id}` as TKey)}
                </Txt>
              )}
            </SystemWindow>
          );
        })()}

        <Note icon={<IconInfo />}>
          <Txt variant="bodySm" tone="dim">{t('army.perksNote')}</Txt>
        </Note>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4.5 },
  cell: { width: '33.333%', paddingHorizontal: 4.5, paddingBottom: 9 },
  card: {
    alignItems: 'center', paddingVertical: 13, paddingHorizontal: 8,
    backgroundColor: color.surface, borderWidth: 1, minHeight: 96,
  },
  cardName: { fontSize: 12.5, marginTop: 8, marginBottom: 2 },
  cardBar: { alignSelf: 'stretch', marginTop: 6 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextIcon: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.45)',
  },
});
