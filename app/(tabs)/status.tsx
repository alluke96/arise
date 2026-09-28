import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  HudLabel, IconAlert, IconClock, IconFlame, IconStone, Note, RadarChart, RankBadge,
  Screen, StatBar, SystemButton, SystemWindow, Txt, color, space,
} from '../../src/ui';
import { useHunter } from '../../src/features/hunter/store';
import { useLocale, useSystemText, useT } from '../../src/features/settings/store';
import { Countdown } from '../../src/features/common/Countdown';
import { levelProgress } from '../../src/core/engine';
import { formatNumber, type TKey } from '../../src/core/i18n';
import { exerciseById, exerciseName } from '../../src/data/exercises';
import type { Attribute } from '../../src/core/types';
import { TEST_BUILD } from '../../src/core/config';

const ATTRS: Attribute[] = ['STR', 'AGI', 'VIT', 'PER', 'INT'];

function HeaderAction({ href, label, tone }: {
  href: '/laboratorio' | '/reavaliacao' | '/ajustes'; label: string; tone: 'gold' | 'blue' | 'muted';
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.headerAction}>
        <HudLabel tone={tone} style={{ fontSize: 10.5 }} numberOfLines={1}>{label}</HudLabel>
      </Pressable>
    </Link>
  );
}

export default function StatusScreen() {
  const router = useRouter();
  const t = useT();
  const sys = useSystemText();
  const locale = useLocale();
  const h = useHunter();
  const { profile, progression, quest, screening } = h;
  // Derivado no render, NÃO num selector: `levelProgress` monta objeto novo a
  // cada chamada, e o Zustand v5 compara snapshot por referência.
  const xp = levelProgress(progression);

  if (!profile) return <Screen><View /></Screen>;

  const done = quest?.status === 'completed';
  const reentry = (h.streak?.reentrySessionsLeft ?? 0) > 0;

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título numa linha, ações numa linha própria que quebra se faltar
            espaço: lado a lado, os quatro rótulos vazavam da tela. */}
        <View style={styles.header}>
          <HudLabel tone="muted" style={{ fontSize: 10 }} numberOfLines={1}>{t('status.association')}</HudLabel>
          <View style={styles.headerActions}>
            {TEST_BUILD && <HeaderAction href="/laboratorio" label={t('lab.short')} tone="gold" />}
            <HeaderAction href="/reavaliacao" label={t('status.reassess')} tone="blue" />
            <HeaderAction href="/ajustes" label={t('status.settings')} tone="muted" />
          </View>
        </View>

        {h.screeningExpired && (
          <Note tone="red" icon={<IconAlert />}>
            <Txt variant="bodySm" tone="dim">{t('status.screeningExpired')}</Txt>
            <Pressable accessibilityRole="button" onPress={() => router.push('/(onboarding)/triagem?renew=1')}
              style={styles.inlineAction}>
              <HudLabel tone="red">{t('status.redoScreening')}</HudLabel>
            </Pressable>
          </Note>
        )}

        {screening?.result === 'caution' && (
          <Note tone="red" icon={<IconAlert />}>
            <Txt variant="bodySm" tone="dim">{sys('cautionMode')}</Txt>
          </Note>
        )}

        {h.dungeonBreak && (
          <SystemWindow variant="alert" padding={16}>
            <HudLabel tone="red">{t('penalty.dungeonBreak')}</HudLabel>
            <Txt variant="bodySm" tone="dim" style={{ marginVertical: 8 }}>{t('penalty.dungeonBreakBody')}</Txt>
            <SystemButton label={t('penalty.returnToField')} variant="danger" height={46}
              onPress={h.dismissDungeonBreak} />
          </SystemWindow>
        )}

        {h.penaltyOpenFor && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/penalidade')}>
            <SystemWindow variant="alert" padding={16}>
              <HudLabel tone="red">{t('status.penaltyOpen')}</HudLabel>
              <Txt variant="bodySm" tone="dim" style={{ marginTop: 6 }}>{sys('penaltyOpened')}</Txt>
            </SystemWindow>
          </Pressable>
        )}

        <SystemWindow padding={17}>
          <View style={styles.hunterRow}>
            <RankBadge rank={progression.rank} size="md" />
            <View style={styles.hunterInfo}>
              <Txt variant="title" style={{ fontSize: 18 }}>{profile.hunterName}</Txt>
              <Txt variant="bodySm" tone="muted" style={{ marginTop: 3 }}>
                {t(`ranks.${progression.rank}` as TKey)}
              </Txt>
              <View style={styles.xpRow}>
                <HudLabel tone="blue" style={{ fontSize: 12 }}>{t('status.level', { level: progression.level })}</HudLabel>
                <Txt variant="bodySm" tone="muted">
                  {formatNumber(xp.current, locale)} / {formatNumber(xp.needed, locale)} XP
                </Txt>
              </View>
              <StatBar ratio={xp.ratio} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.attrRow}>
            <RadarChart values={progression.attributes} size={128}
              labels={ATTRS.map((a) => t(`status.attributesShort.${a}` as TKey))} />
            <View style={styles.attrList}>
              {ATTRS.map((k) => (
                <View key={k} style={styles.attrItem}>
                  <Txt variant="bodySm" tone="dim" style={{ fontSize: 13 }}>{t(`status.attributes.${k}` as TKey)}</Txt>
                  <Txt variant="stat" style={{ fontSize: 16 }}>{progression.attributes[k]}</Txt>
                </View>
              ))}
            </View>
          </View>
          {progression.unspentPoints > 0 && (
            <Txt variant="bodySm" tone="blue" style={{ marginTop: 12 }}>
              {t('status.unspentPoints', { count: progression.unspentPoints })}
            </Txt>
          )}
        </SystemWindow>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statRed]}>
            <IconFlame />
            <View>
              <Txt variant="stat" style={{ fontSize: 17 }}>{progression.streakCurrent}</Txt>
              <Txt variant="bodySm" tone="dim" style={{ fontSize: 11 }}>{t('status.streak')}</Txt>
            </View>
          </View>
          <View style={[styles.statCard, styles.statBlue]}>
            <IconStone />
            <View style={{ flex: 1 }}>
              <Txt variant="stat" style={{ fontSize: 17 }}>{progression.recoveryStones}</Txt>
              <Txt variant="bodySm" tone="dim" style={{ fontSize: 11 }}>{t('status.recoveryStones')}</Txt>
            </View>
          </View>
        </View>

        {quest && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/missao')}>
            <SystemWindow variant="highlight" padding={17}>
              <View style={styles.questHeader}>
                <HudLabel tone="blue">{quest.isRestDay ? t('status.restDay') : t('quest.daily')}</HudLabel>
                {!done && !quest.isRestDay && (
                  <View style={styles.deadline}>
                    <IconClock />
                    <Countdown deadline={quest.deadline} style={{ fontSize: 13 }} />
                  </View>
                )}
              </View>

              {done ? (
                <Txt variant="body" tone="green">
                  {t('status.questDone', { xp: quest.xpAwarded ?? 0 })}
                </Txt>
              ) : quest.isRestDay ? (
                <Txt variant="bodySm" tone="dim">{sys('restDay')}</Txt>
              ) : (
                <>
                  {quest.isDeload && <Txt variant="bodySm" tone="blue" style={{ marginBottom: 10 }}>{sys('deloadWeek')}</Txt>}
                  {reentry && <Txt variant="bodySm" tone="blue" style={{ marginBottom: 10 }}>{t('status.reentry')}</Txt>}
                  {quest.objectives.map((o) => {
                    const ex = exerciseById(o.exerciseId);
                    const ok = o.actualValue >= o.targetValue;
                    return (
                      <View key={o.exerciseId} style={styles.objective}>
                        <View style={styles.objectiveRow}>
                          <Txt variant="bodySm" style={{ fontSize: 13, flex: 1 }}>{ex ? exerciseName(ex, locale) : o.exerciseId}</Txt>
                          <Txt variant="bodySm" tone={ok ? 'green' : 'dim'} style={{ fontSize: 12 }}>
                            {o.actualValue} / {o.targetValue}{o.unit === 'seconds' ? 's' : o.unit === 'minutes' ? ' min' : ''}
                          </Txt>
                        </View>
                        <StatBar ratio={o.targetValue ? o.actualValue / o.targetValue : 0} height={4} glow={false}
                          fill={ok ? color.green : color.purpleLight} />
                      </View>
                    );
                  })}
                </>
              )}

              {!done && (
                <View style={styles.cta}>
                  <HudLabel style={{ fontSize: 13, letterSpacing: 2.4 }}>
                    {quest.isRestDay ? t('status.honorRest') : t('quest.continueQuest')}
                  </HudLabel>
                </View>
              )}
            </SystemWindow>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.lg },
  header: { gap: 10 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  headerAction: {
    minHeight: 36, paddingHorizontal: 14, justifyContent: 'center',
    backgroundColor: color.purpleDim, borderWidth: 1, borderColor: color.purpleBorder,
  },
  inlineAction: { marginTop: 8, minHeight: 32, justifyContent: 'center' },
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
  objectiveRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5, gap: 8 },
  cta: { height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: color.purple, marginTop: 6 },
});
