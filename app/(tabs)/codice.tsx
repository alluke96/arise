import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  Choice, HudLabel, IconAlert, IconCheck, IconLock, Note, Screen, Txt, color, font, space,
} from '../../src/ui';
import { useHunter } from '../../src/features/hunter/store';
import { useLocale, useT } from '../../src/features/settings/store';
import { EXERCISES, exerciseCriteria, exerciseCues, exerciseErrors, exerciseName, exercisesByPattern, systemName } from '../../src/data/exercises';
import { isPrescribable, rankAtLeast } from '../../src/core/engine';
import type { Exercise, Pattern } from '../../src/core/types';
import { REQUIRE_ILLUSTRATIONS } from '../../src/core/config';
import type { TKey } from '../../src/core/i18n';

const PATTERNS: Pattern[] = [
  'push_h', 'squat', 'core_anti_ext', 'pull_h', 'hinge', 'unilateral',
  'push_v', 'pull_v', 'core_anti_rot', 'trunk_flex', 'carry', 'aerobic', 'mobility',
];

export default function CodiceScreen() {
  const t = useT();
  const locale = useLocale();
  const { profile, progression, ladder } = useHunter();
  const [pattern, setPattern] = useState<Pattern>('push_h');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return EXERCISES.filter((e) => exerciseName(e, locale).toLowerCase().includes(q)
      || e.namePt.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q));
  }, [query, locale]);

  const list = matches ?? exercisesByPattern(pattern);
  const currentId = ladder[pattern]?.exerciseId;
  const currentDifficulty = EXERCISES.find((e) => e.id === currentId)?.difficulty ?? 0;
  const limitations = profile?.limitations ?? [];

  const stateOf = (e: Exercise) => {
    if (!isPrescribable(e)) return 'noIllustration' as const;
    if (e.contraindications.some((c) => limitations.includes(c))) return 'contraindicated' as const;
    if (!rankAtLeast(progression.rank, e.minRank)) return 'rankLocked' as const;
    if (e.id === currentId) return 'current' as const;
    if (!matches && e.difficulty < currentDifficulty) return 'mastered' as const;
    return 'available' as const;
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Txt variant="title" accessibilityRole="header">{t('codex.title')}</Txt>
          <Txt variant="bodySm" tone="dim" style={{ marginTop: 4 }}>{t('codex.subtitle', { count: EXERCISES.length })}</Txt>
        </View>

        <View style={styles.search}>
          <TextInput accessibilityLabel={t('codex.search')} value={query} onChangeText={setQuery}
            placeholder={t('codex.search')} placeholderTextColor={color.textMuted} style={styles.searchInput} />
        </View>

        {!matches && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Choice<Pattern> value={pattern} onChange={(p) => { setPattern(p); setOpen(null); }}
              options={PATTERNS.map((p) => ({ value: p, label: t(`patterns.${p}` as TKey) }))} />
          </ScrollView>
        )}

        <HudLabel tone="muted">
          {matches ? t('codex.results', { count: matches.length }) : t('codex.ladderOf', { pattern: t(`patterns.${pattern}` as TKey) })}
        </HudLabel>

        {list.map((ex, i) => {
          const state = stateOf(ex);
          const expanded = open === ex.id;
          const dim = state === 'noIllustration' || state === 'contraindicated' || state === 'rankLocked';
          return (
            <Pressable key={ex.id} accessibilityRole="button" accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : ex.id)}
              style={[styles.step, state === 'current' && styles.stepCurrent, state === 'mastered' && styles.stepMastered, dim && styles.stepBlocked]}>
              <View style={styles.stepHead}>
                <View style={[styles.num, state === 'current' && styles.numCurrent]}>
                  <Txt variant="bodySm" tone={state === 'current' ? 'default' : dim ? 'locked' : 'purple'}
                    style={{ fontFamily: font.displayMedium, fontSize: 13 }}>{matches ? ex.difficulty : i + 1}</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodySm" tone={dim ? 'locked' : 'default'} style={{ fontSize: 14.5 }}>{exerciseName(ex, locale)}</Txt>
                  <Txt variant="bodySm" tone={state === 'current' ? 'blue' : 'muted'} style={{ fontSize: 11.5, marginTop: 2 }}>
                    {t(`codex.state.${state}` as TKey, { rank: ex.minRank, name: systemName(ex, locale) })}
                  </Txt>
                </View>
                {state === 'mastered' && <IconCheck />}
                {dim && <IconLock />}
              </View>

              {expanded && (
                <View style={styles.detail}>
                  <HudLabel tone="blue" style={{ fontSize: 10 }}>{t('codex.cues')}</HudLabel>
                  {exerciseCues(ex, locale).map((c) => <Txt key={c} variant="bodySm" tone="dim">· {c}</Txt>)}
                  <HudLabel tone="red" style={{ fontSize: 10, marginTop: 8 }}>{t('codex.commonErrors')}</HudLabel>
                  {exerciseErrors(ex, locale).map((c) => <Txt key={c} variant="bodySm" tone="dim">· {c}</Txt>)}
                  <HudLabel tone="muted" style={{ fontSize: 10, marginTop: 8 }}>{t('codex.criteria')}</HudLabel>
                  <Txt variant="bodySm" tone="dim">{exerciseCriteria(ex, locale)}</Txt>
                </View>
              )}
            </Pressable>
          );
        })}

        {REQUIRE_ILLUSTRATIONS && (
          <Note tone="red" icon={<IconAlert />}>
            <Txt variant="bodySm" tone="dim">{t('codex.illustrationRule')}</Txt>
          </Note>
        )}

        {limitations.length > 0 && (
          <Note>
            <HudLabel tone="blue" style={{ fontSize: 10.5, marginBottom: 5 }}>{t('codex.adaptedForYou')}</HudLabel>
            <Txt variant="bodySm" tone="dim">
              {t('codex.adaptedBody', {
                limits: limitations.map((l) => t(`limits.${l}` as TKey).toLowerCase()).join(', '),
                rank: progression.rank,
              })}
            </Txt>
          </Note>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  search: { height: 48, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: color.surface, borderWidth: 1, borderColor: color.purpleBorder },
  searchInput: { color: color.text, fontSize: 15, fontFamily: font.body },
  step: { padding: 12, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepCurrent: { backgroundColor: color.blueDim, borderColor: color.blue },
  stepMastered: { backgroundColor: color.greenDim, borderColor: color.greenBorder },
  stepBlocked: { backgroundColor: color.surfaceAlt, borderColor: 'rgba(139,92,246,0.16)' },
  num: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: color.purpleDim, borderWidth: 1, borderColor: color.purpleBorder },
  numCurrent: { backgroundColor: color.blue, borderColor: color.blue },
  detail: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: color.line, gap: 4 },
});
