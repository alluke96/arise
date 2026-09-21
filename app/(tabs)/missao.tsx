import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconBack, IconCheck, IconClock, IconStar, Screen, StatBar,
  SystemButton, Txt, color, font, space,
} from '../../src/ui';
import { useQuest } from '../../src/features/quest/store';
import { exerciseById } from '../../src/data/exercises';

const UNIT_SUFFIX = { reps: '', seconds: 's', minutes: 'min', meters: 'm' } as const;

export default function MissaoScreen() {
  const router = useRouter();
  const { quest, load } = useQuest();

  useEffect(() => { void load(); }, [load]);

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar"
            onPress={() => router.push('/status')} hitSlop={12}>
            <IconBack />
          </Pressable>
          <HudLabel style={{ fontSize: 17, letterSpacing: 2.4 }}>Missão Diária</HudLabel>
        </View>

        <View>
          <HudLabel tone="muted">Quest</HudLabel>
          <Txt variant="title" style={styles.questName}>
            A Preparação Para Se Tornar Poderoso
          </Txt>
        </View>

        <View style={styles.deadline}>
          <View style={styles.deadlineLabel}>
            <IconClock />
            <Txt variant="bodySm" tone="dim" style={{ fontSize: 13 }}>Prazo</Txt>
          </View>
          <Txt variant="stat" tone="red" style={{ fontSize: 19 }}>6h 12min</Txt>
        </View>

        {quest?.objectives.map((o) => {
          const ex = exerciseById(o.exerciseId);
          const done = o.actualValue >= o.targetValue;
          const ratio = o.targetValue > 0 ? o.actualValue / o.targetValue : 0;
          return (
            <Pressable
              key={o.exerciseId}
              accessibilityRole="button"
              accessibilityLabel={`${ex?.namePt}. ${o.actualValue} de ${o.targetValue}`}
              onPress={() => router.push({ pathname: '/sessao', params: { id: o.exerciseId } })}
              style={[styles.objective, done ? styles.objectiveDone : styles.objectivePending]}
            >
              <View style={styles.objectiveHead}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Txt variant="bodyStrong">{ex?.namePt ?? o.exerciseId}</Txt>
                    {done && <IconCheck />}
                  </View>
                  <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>
                    {done ? `Concluído · RPE ${o.rpe ?? '—'}` : ex?.systemNamePt}
                  </Txt>
                </View>
                <Txt variant="stat" tone={done ? 'green' : 'default'}>
                  {o.actualValue}
                  <Txt variant="stat" tone={done ? 'green' : 'muted'} style={{ fontSize: 14 }}>
                    /{o.targetValue}{UNIT_SUFFIX[o.unit]}
                  </Txt>
                </Txt>
              </View>
              <StatBar ratio={ratio} glow={false}
                fill={done ? color.green : color.purpleLight} />
            </Pressable>
          );
        })}

        <View style={styles.reward}>
          <IconStar />
          <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
            Recompensa: <Txt variant="bodySm" tone="default">+3 pontos de atributo</Txt>, 180 XP e uma caixa de loot.
          </Txt>
        </View>

        <SystemButton
          label="Retomar"
          onPress={() => {
            const next = quest?.objectives.find((o) => o.actualValue < o.targetValue);
            router.push({ pathname: '/sessao', params: { id: next?.exerciseId ?? 'push_knee' } });
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  questName: { fontSize: 19, marginTop: 4, letterSpacing: 0.4, fontFamily: font.display },
  deadline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 15,
    backgroundColor: color.redDim, borderWidth: 1, borderColor: color.redBorder,
  },
  deadlineLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  objective: { padding: 15, borderWidth: 1, borderLeftWidth: 3 },
  objectivePending: { backgroundColor: color.surface, borderColor: color.line, borderLeftColor: color.purpleLight },
  objectiveDone: { backgroundColor: color.greenDim, borderColor: color.greenBorder, borderLeftColor: color.green },
  objectiveHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reward: {
    flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12,
    backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
});
