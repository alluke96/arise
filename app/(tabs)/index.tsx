import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  HudLabel, IconClock, IconFlame, IconStone, RadarChart, RankBadge,
  Screen, StatBar, SystemWindow, Txt, color, space,
} from '../../src/ui';
import { selectLevelProgress, useProgression } from '../../src/features/progression/store';
import { useQuest } from '../../src/features/quest/store';
import { exerciseById } from '../../src/data/exercises';
import { RANK_CRITERIA } from '../../src/core/engine';

const ATTR_LABEL = {
  STR: 'Força', AGI: 'Agilidade', VIT: 'Vitalidade',
  PER: 'Percepção', INT: 'Inteligência',
} as const;

export default function StatusScreen() {
  const router = useRouter();
  const { profile, progression, hydrate } = useProgression();
  const xp = useProgression(selectLevelProgress);
  const { quest, load } = useQuest();

  useEffect(() => {
    void hydrate();
    void load();
  }, [hydrate, load]);

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <HudLabel tone="muted" style={{ fontSize: 10 }}>Associação de Caçadores</HudLabel>
          <Link href="/reavaliacao" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Reavaliação de Rank" hitSlop={12}>
              <HudLabel tone="blue" style={{ fontSize: 10 }}>Reavaliar</HudLabel>
            </Pressable>
          </Link>
        </View>

        <SystemWindow padding={17}>
          <View style={styles.hunterRow}>
            <RankBadge rank={progression.rank} size="md" />
            <View style={styles.hunterInfo}>
              <Txt variant="title" style={{ fontSize: 18 }}>{profile.hunterName}</Txt>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 3 }}>
                {RANK_CRITERIA[progression.rank].titlePt}
              </Txt>
              <View style={styles.xpRow}>
                <HudLabel tone="blue" style={{ fontSize: 12 }}>Nível {progression.level}</HudLabel>
                <Txt variant="bodySm" tone="muted">
                  {xp.current.toLocaleString('pt-BR')} / {xp.needed.toLocaleString('pt-BR')} XP
                </Txt>
              </View>
              <StatBar ratio={xp.ratio} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.attrRow}>
            <RadarChart values={progression.attributes} size={128} />
            <View style={styles.attrList}>
              {(Object.keys(ATTR_LABEL) as (keyof typeof ATTR_LABEL)[]).map((k) => (
                <View key={k} style={styles.attrItem}>
                  <Txt variant="bodySm" tone="dim" style={{ fontSize: 13 }}>{ATTR_LABEL[k]}</Txt>
                  <Txt variant="stat" style={{ fontSize: 16 }}>{progression.attributes[k]}</Txt>
                </View>
              ))}
            </View>
          </View>
        </SystemWindow>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statRed]}>
            <IconFlame />
            <View>
              <Txt variant="stat" style={{ fontSize: 17 }}>{progression.streakCurrent} dias</Txt>
              <Txt variant="bodySm" tone="dim" style={{ fontSize: 11 }}>sequência</Txt>
            </View>
          </View>
          <View style={[styles.statCard, styles.statBlue]}>
            <IconStone />
            <View style={{ flex: 1 }}>
              <Txt variant="stat" style={{ fontSize: 17 }}>{progression.recoveryStones}</Txt>
              <Txt variant="bodySm" tone="dim" style={{ fontSize: 11 }}>pedras de recuperação</Txt>
            </View>
          </View>
        </View>

        <Pressable onPress={() => router.push('/(tabs)/missao')} accessibilityRole="button">
          <SystemWindow variant="highlight" padding={17}>
            <View style={styles.questHeader}>
              <HudLabel tone="blue">Missão diária</HudLabel>
              <View style={styles.deadline}>
                <IconClock />
                <Txt variant="bodyStrong" tone="red" style={{ fontSize: 13 }}>6h 12min</Txt>
              </View>
            </View>

            {quest?.objectives.map((o) => {
              const ex = exerciseById(o.exerciseId);
              const done = o.actualValue >= o.targetValue;
              const ratio = o.targetValue > 0 ? o.actualValue / o.targetValue : 0;
              return (
                <View key={o.exerciseId} style={styles.objective}>
                  <View style={styles.objectiveRow}>
                    <Txt variant="bodySm" style={{ fontSize: 13 }}>{ex?.namePt ?? o.exerciseId}</Txt>
                    <Txt variant="bodySm" tone={done ? 'green' : 'dim'} style={{ fontSize: 12 }}>
                      {o.actualValue} / {o.targetValue}{o.unit === 'seconds' ? 's' : o.unit === 'minutes' ? ' min' : ''}
                    </Txt>
                  </View>
                  <StatBar ratio={ratio} height={4} glow={false}
                    fill={done ? color.green : color.purpleLight} />
                </View>
              );
            })}

            <View style={styles.cta}>
              <HudLabel style={{ fontSize: 13, letterSpacing: 2.4 }}>Continuar missão</HudLabel>
            </View>
          </SystemWindow>
        </Pressable>

        <Link href="/penalidade" asChild>
          <Pressable accessibilityRole="button" style={styles.penaltyLink}>
            <Txt variant="bodySm" tone="muted">Ver Zona de Penalidade (demo)</Txt>
          </Pressable>
        </Link>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hunterRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  hunterInfo: { flex: 1 },
  xpRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: 5 },
  divider: { height: 1, backgroundColor: color.line, marginVertical: 15 },
  attrRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  attrList: { flex: 1, gap: 9 },
  attrItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1 },
  statRed: { backgroundColor: color.redDim, borderColor: color.redBorder },
  statBlue: { backgroundColor: color.blueDim, borderColor: 'rgba(125,211,252,0.28)' },
  questHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  objective: { marginBottom: 10 },
  objectiveRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 },
  cta: {
    height: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.purple, marginTop: 4,
  },
  penaltyLink: { alignItems: 'center', paddingVertical: 8 },
});
