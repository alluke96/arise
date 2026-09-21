import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  HudLabel, RepCounter, Screen, SystemButton, Txt, color, font, space,
} from '../src/ui';
import { useQuest } from '../src/features/quest/store';
import { exerciseById } from '../src/data/exercises';
import type { RpeBand } from '../src/core/types';

const RPE_BANDS: { band: RpeBand; range: string; label: string; danger?: boolean }[] = [
  { band: 3, range: '3–4', label: 'leve' },
  { band: 5, range: '5–6', label: 'moderado' },
  { band: 7, range: '7–8', label: 'difícil' },
  { band: 9, range: '9–10', label: 'máximo', danger: true },
];

export default function Sessao() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { quest, recordReps, finishObjective } = useQuest();

  const objective = useMemo(
    () => quest?.objectives.find((o) => o.exerciseId === id) ?? quest?.objectives[0],
    [quest, id],
  );
  const exercise = objective ? exerciseById(objective.exerciseId) : undefined;
  const [rpe, setRpe] = useState<RpeBand>(5);

  if (!objective || !exercise) {
    return (
      <Screen>
        <View style={styles.empty}><Txt tone="dim">Nenhum objetivo ativo.</Txt></View>
      </Screen>
    );
  }

  const unitLabel = objective.unit === 'seconds' ? 'segundos'
    : objective.unit === 'minutes' ? 'minutos' : 'repetições';

  return (
    <Screen tone="ritual">
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Sair da série"
            onPress={() => router.back()} hitSlop={12} style={styles.close}>
            <Txt tone="dim" style={{ fontSize: 22 }}>×</Txt>
          </Pressable>
          <HudLabel tone="muted" style={{ fontSize: 11 }}>Série 2 de 2</HudLabel>
          <View style={styles.close} />
        </View>

        <View style={styles.setBars}>
          <View style={[styles.setBar, { backgroundColor: color.green }]} />
          <View style={[styles.setBar, { backgroundColor: color.blue }]} />
        </View>

        <HudLabel tone="blue" style={styles.systemName}>{exercise.systemNamePt}</HudLabel>
        <Txt variant="title" style={styles.name}>{exercise.namePt}</Txt>

        {/* R11.3 — o par de ilustrações é deliverable da Fase 3. Até lá o
            espaço é um placeholder honesto, não uma imagem falsa. */}
        <View style={styles.illustration}>
          <Txt variant="bodySm" tone="muted">
            {exercise.illustrations ? 'Ilustração: posição inicial → final' : 'Sem ilustração'}
          </Txt>
          <Txt variant="hudSmall" tone="locked" style={{ marginTop: 6 }}>Fase 3</Txt>
        </View>

        <View style={styles.cues}>
          {exercise.cues.map((c, i) => (
            <View key={c} style={styles.cueRow}>
              <Txt variant="bodySm" tone="blue" style={styles.cueNum}>{i + 1}</Txt>
              <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>{c}</Txt>
            </View>
          ))}
        </View>

        <RepCounter
          value={objective.actualValue}
          target={objective.targetValue}
          unit={unitLabel}
          onIncrement={() => recordReps(objective.exerciseId, objective.actualValue + 1)}
        />

        <View style={styles.rpeBlock}>
          <View style={styles.rpeHead}>
            <HudLabel tone="muted" style={{ fontSize: 11 }}>Esforço percebido</HudLabel>
            <Txt variant="bodySm" tone="blue">consegue falar uma frase?</Txt>
          </View>
          <View style={styles.rpeRow} accessibilityRole="radiogroup">
            {RPE_BANDS.map((b) => {
              const on = rpe === b.band;
              return (
                <Pressable
                  key={b.band}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`RPE ${b.range}, ${b.label}`}
                  onPress={() => setRpe(b.band)}
                  style={[
                    styles.rpeBtn,
                    on ? styles.rpeOn : b.danger ? styles.rpeDanger : styles.rpeOff,
                  ]}
                >
                  <Txt variant="bodySm" tone={on ? 'default' : b.danger ? 'red' : 'dim'}
                    style={styles.rpeRange}>{b.range}</Txt>
                  <Txt variant="bodySm" tone={on ? 'default' : b.danger ? 'red' : 'muted'}
                    style={styles.rpeLabel}>{b.label}</Txt>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* R5.7–R5.9 — sempre visíveis, regressão imediata, sem julgamento. */}
        <View style={styles.escapeRow}>
          <Pressable accessibilityRole="button"
            onPress={() => router.back()} style={[styles.escape, styles.escapeHard]}>
            <Txt variant="bodySm" tone="red" style={styles.escapeText}>Muito difícil</Txt>
          </Pressable>
          <Pressable accessibilityRole="button"
            onPress={() => router.back()} style={[styles.escape, styles.escapeEasy]}>
            <Txt variant="bodySm" tone="blue" style={styles.escapeText}>Muito fácil</Txt>
          </Pressable>
        </View>
        <Txt variant="bodySm" tone="muted" style={styles.escapeNote}>
          Regride ou progride na hora. Sem julgamento.
        </Txt>

        <SystemButton
          label="Concluir série"
          onPress={() => {
            finishObjective(objective.exerciseId, rpe, true);
            router.push('/levelup');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: space.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  setBars: { flexDirection: 'row', gap: 6 },
  setBar: { flex: 1, height: 3 },
  systemName: { textAlign: 'center', fontSize: 11, marginTop: 6 },
  name: { textAlign: 'center', fontSize: 23, marginTop: -6 },
  illustration: {
    height: 96, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.purpleBorder,
    borderStyle: 'dashed',
  },
  cues: { gap: 6 },
  cueRow: { flexDirection: 'row', gap: 9 },
  cueNum: { width: 14, fontFamily: font.displayMedium },
  rpeBlock: { gap: 9 },
  rpeHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rpeRow: { flexDirection: 'row', gap: 7 },
  rpeBtn: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rpeOn: {
    backgroundColor: color.purple, borderColor: color.purpleLight,
    shadowColor: color.purple, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  rpeOff: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  rpeDanger: { backgroundColor: color.redDim, borderColor: color.redBorder },
  rpeRange: { fontFamily: font.displayMedium, fontSize: 12 },
  rpeLabel: { fontSize: 10, letterSpacing: 0.6 },
  escapeRow: { flexDirection: 'row', gap: 9 },
  escape: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  escapeHard: { backgroundColor: color.redDim, borderColor: 'rgba(255,59,92,0.38)' },
  escapeEasy: { backgroundColor: color.blueDim, borderColor: color.blueBorder },
  escapeText: { fontFamily: font.displayMedium, fontSize: 12.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  escapeNote: { textAlign: 'center', fontSize: 11.5 },
});
