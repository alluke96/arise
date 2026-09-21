import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  HudLabel, IconAlert, IconCheck, IconLock, Screen, Txt, color, font, space,
} from '../../src/ui';
import { EXERCISES, ladderFor } from '../../src/data/exercises';
import { isPrescribable } from '../../src/core/engine';
import { useProgression } from '../../src/features/progression/store';

const LIMIT_LABEL = {
  knee: 'joelho', lower_back: 'lombar', shoulder: 'ombro',
  wrist: 'punho', neck: 'pescoço',
} as const;

export default function CodiceScreen() {
  const { profile, progression } = useProgression();
  const [query, setQuery] = useState('flexão');

  const ladder = ladderFor('push_knee');
  const matches = EXERCISES.filter((e) =>
    e.namePt.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Txt variant="title">Códice</Txt>
          <Txt variant="bodySm" tone="dim" style={{ marginTop: 4 }}>
            {EXERCISES.length} exercícios no seed · escada de progressão completa
          </Txt>
        </View>

        <View style={styles.search}>
          <TextInput
            accessibilityLabel="Buscar exercício"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar"
            placeholderTextColor={color.textMuted}
            style={styles.searchInput}
          />
          <Txt variant="bodySm" tone="muted">{matches.length}</Txt>
        </View>

        <HudLabel tone="muted">Escada da flexão</HudLabel>

        {ladder.map((ex, i) => {
          const blocked = !isPrescribable(ex);
          const isCurrent = ex.id === 'push_knee';
          const mastered = i < ladder.findIndex((e) => e.id === 'push_knee');

          return (
            <View key={ex.id} style={[
              styles.step,
              isCurrent && styles.stepCurrent,
              mastered && styles.stepMastered,
              blocked && styles.stepBlocked,
            ]}>
              <View style={[
                styles.stepNum,
                isCurrent && styles.stepNumCurrent,
                mastered && styles.stepNumMastered,
                blocked && styles.stepNumBlocked,
              ]}>
                <Txt variant="bodySm" tone={isCurrent ? 'default' : mastered ? 'green' : blocked ? 'locked' : 'purple'}
                  style={{ fontFamily: font.displayMedium, fontSize: 13 }}>
                  {i + 1}
                </Txt>
              </View>

              <View style={{ flex: 1 }}>
                <Txt variant="bodySm" tone={blocked ? 'locked' : 'default'} style={{ fontSize: 14.5 }}>
                  {ex.namePt}
                </Txt>
                <Txt variant="bodySm" tone={isCurrent ? 'blue' : blocked ? 'locked' : 'muted'}
                  style={{ fontSize: 11.5, marginTop: 2 }}>
                  {blocked
                    ? 'Bloqueado — sem par de ilustrações'
                    : isCurrent
                      ? `Atual · ${ex.systemNamePt}`
                      : mastered
                        ? 'Dominado'
                        : ex.progressionCriteria}
                </Txt>
              </View>

              {mastered && <IconCheck />}
              {blocked && <IconLock />}
              {isCurrent && (
                <View style={styles.activeTag}>
                  <HudLabel tone="blue" style={{ fontSize: 10 }}>Ativo</HudLabel>
                </View>
              )}
            </View>
          );
        })}

        {/* R11.4 visível em produto: o exercício sem ilustração não é
            apenas escondido — ele é mostrado bloqueado, com o motivo. */}
        <View style={styles.rule}>
          <IconAlert />
          <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
            Exercício de carga sem par de ilustrações fica bloqueado e não é prescrito.
            Cue de texto não ensina forma para quem nunca treinou.
          </Txt>
        </View>

        {profile.limitations.length > 0 && (
          <View style={styles.adapted}>
            <HudLabel tone="red" style={{ fontSize: 10.5, marginBottom: 5 }}>Adaptado para você</HudLabel>
            <Txt variant="bodySm" tone="dim">
              Você marcou{' '}
              <Txt variant="bodySm" tone="default">
                {profile.limitations.map((l) => LIMIT_LABEL[l]).join(', ')}
              </Txt>{' '}
              na triagem. O Sistema removeu os exercícios contraindicados do Rank {progression.rank}.
            </Txt>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14,
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.purpleBorder,
  },
  searchInput: { flex: 1, color: color.text, fontSize: 15, fontFamily: font.body },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1 },
  stepCurrent: {
    backgroundColor: color.blueDim, borderColor: color.blue,
    shadowColor: color.blue, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
  },
  stepMastered: { backgroundColor: color.greenDim, borderColor: color.greenBorder },
  stepBlocked: { backgroundColor: color.surfaceAlt, borderColor: 'rgba(139,92,246,0.16)' },
  stepNum: {
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.purpleDim, borderWidth: 1, borderColor: color.purpleBorder,
  },
  stepNumCurrent: { backgroundColor: color.blue, borderColor: color.blue },
  stepNumMastered: { backgroundColor: 'rgba(74,222,128,0.12)', borderColor: color.greenBorder },
  stepNumBlocked: { backgroundColor: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.22)' },
  activeTag: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(125,211,252,0.16)' },
  rule: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13,
    backgroundColor: color.redDim, borderWidth: 1, borderColor: 'rgba(255,59,92,0.28)',
  },
  adapted: {
    padding: 14, backgroundColor: color.surface,
    borderLeftWidth: 2, borderLeftColor: color.purpleLight,
  },
});
