import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  HudLabel, IconShield, IconStar, Screen, SystemButton, SystemWindow, Txt, color, font, space,
} from '../src/ui';
import { useHunter } from '../src/features/hunter/store';
import { useLocale, useSystemText, useT } from '../src/features/settings/store';
import { shadowById, shadowText } from '../src/data/shadows';

/**
 * Tela de resultado. Mostra o que REALMENTE aconteceu: só diz "LEVEL UP"
 * quando o nível subiu. Uma versão anterior mostrava "nível + 1" depois de
 * qualquer série, sem conceder XP nenhum.
 */
export default function LevelUp() {
  const router = useRouter();
  const t = useT();
  const sys = useSystemText();
  const locale = useLocale();
  const c = useHunter((s) => s.lastCompletion);

  const leveled = (c?.levelsGained ?? 0) > 0;
  useEffect(() => {
    if (c) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [c]);

  if (!c) {
    return (
      <Screen>
        <View style={styles.empty}>
          <SystemButton label={t('common.continue')} onPress={() => router.replace('/status')} />
        </View>
      </Screen>
    );
  }

  const partial = c.session.completion === 'partial';

  return (
    <Screen tone="ritual">
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.head}>
          <HudLabel tone="green">{partial ? t('levelUp.sessionEnded') : t('levelUp.questComplete')}</HudLabel>
          <Txt variant="bodySm" tone="dim" style={{ marginTop: 5, textAlign: 'center' }}>
            {partial ? t('levelUp.partialNote') : sys('questCompleted', { xp: c.xpGained })}
          </Txt>
        </View>

        <View style={styles.center}>
          {leveled ? (
            <>
              <Txt style={styles.title} accessibilityRole="header">{t('levelUp.title')}</Txt>
              <View style={styles.rule} />
              <View style={styles.levels} accessibilityLabel={t('status.level', { level: c.after.level })}>
                <Txt variant="statLg" tone="locked" style={{ fontSize: 42 }}>{c.before.level}</Txt>
                <Txt tone="blue" style={styles.arrow}>→</Txt>
                <Txt variant="statLg" style={styles.newLevel}>{c.after.level}</Txt>
              </View>
            </>
          ) : (
            <Txt variant="statLg" style={styles.xpOnly} accessibilityRole="header">+{c.xpGained} XP</Txt>
          )}
        </View>

        <SystemWindow padding={18}>
          <HudLabel tone="muted" style={{ marginBottom: 14 }}>{t('levelUp.rewards')}</HudLabel>
          <Reward label={t('levelUp.experience')} value={`+${c.xpGained} XP`} tone="purple" />
          {c.pointsGained > 0 && <Reward label={t('levelUp.attributePoints')} value={`+${c.pointsGained}`} tone="blue" />}
          <Reward label={t('status.streak')} value={String(c.after.streakCurrent)} tone="red" />

          {c.newShadowIds.map((id) => {
            const shadow = shadowById(id);
            if (!shadow) return null;
            const text = shadowText(shadow, locale);
            return (
              <View key={id} style={styles.shadow}>
                <View style={styles.shadowHead}>
                  <IconShield size={18} c={color.green} />
                  <HudLabel tone="green" style={{ fontSize: 10.5 }}>{sys('shadowExtracted')}</HudLabel>
                </View>
                <Txt variant="bodyStrong" style={{ marginTop: 4 }}>{text.name}</Txt>
                <Txt variant="bodySm" tone="dim">{text.perk}</Txt>
              </View>
            );
          })}
        </SystemWindow>

        <View style={styles.actions}>
          {c.newShadowIds.length > 0 && (
            <SystemButton label={t('levelUp.viewShadow')} variant="ghost" height={54} style={{ flex: 1 }}
              onPress={() => router.replace('/exercito')} />
          )}
          <SystemButton label={t('common.continue')} height={54} style={{ flex: 1 }}
            onPress={() => router.replace('/status')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Reward({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'purple' | 'red' }) {
  const c = tone === 'blue' ? color.blue : tone === 'purple' ? color.purpleSoft : color.redText;
  return (
    <View style={styles.rewardRow}>
      <View style={[styles.rewardIcon, { borderColor: c }]}><IconStar size={16} c={c} /></View>
      <Txt variant="body" style={{ flex: 1 }}>{label}</Txt>
      <Txt variant="stat" tone={tone} style={{ fontSize: 17 }}>{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28, gap: space.lg },
  empty: { flex: 1, justifyContent: 'center', padding: space.xl },
  head: { alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  title: {
    fontFamily: font.displayBold, fontSize: 44, color: '#FFFFFF', letterSpacing: 6,
    textShadowColor: 'rgba(167,139,250,0.9)', textShadowRadius: 28,
  },
  xpOnly: { fontSize: 52, textShadowColor: 'rgba(167,139,250,0.7)', textShadowRadius: 22 },
  rule: {
    width: 180, height: 1, backgroundColor: color.blue, marginVertical: 18,
    shadowColor: color.blue, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  levels: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  arrow: { fontSize: 26, fontFamily: font.display },
  newLevel: { fontSize: 64, textShadowColor: 'rgba(125,211,252,0.7)', textShadowRadius: 22 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 11 },
  rewardIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  shadow: { marginTop: 8, padding: 12, backgroundColor: color.greenDim, borderLeftWidth: 2, borderLeftColor: color.green },
  shadowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 9 },
});
