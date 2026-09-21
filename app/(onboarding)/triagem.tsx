import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconAlert, Screen, SystemButton, Txt, color, font, space,
} from '../../src/ui';
import { Steps } from '../../src/features/onboarding/Steps';
import { evaluateParq, type ParqKey } from '../../src/core/engine';
import { repositories } from '../../src/core/repositories';
import type { Limitation } from '../../src/core/types';

/** Textos provisórios. A tarefa 37 substitui pelas versões OFICIAIS do
 *  PAR-Q+ (original em inglês e a brasileira validada) — traduzir por conta
 *  própria invalidaria o instrumento. */
const QUESTIONS: { key: ParqKey; text: string }[] = [
  { key: 'heart_condition', text: 'Algum médico já disse que você tem problema cardíaco e que só deve fazer atividade física sob supervisão?' },
  { key: 'chest_pain_activity', text: 'Você sente dor no peito ao praticar atividade física?' },
  { key: 'bone_joint', text: 'Você tem algum problema ósseo ou articular que poderia piorar com a prática de atividade física?' },
];

const LIMITS: { key: Limitation; label: string }[] = [
  { key: 'knee', label: 'Joelho' }, { key: 'lower_back', label: 'Lombar' },
  { key: 'shoulder', label: 'Ombro' }, { key: 'wrist', label: 'Punho' },
];

export default function Triagem() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<Record<ParqKey, boolean>>>({ bone_joint: true });
  const [limits, setLimits] = useState<Limitation[]>(['knee']);

  const screening = evaluateParq({ answers, limitations: limits, date: '2026-09-21' });

  const submit = async () => {
    await repositories.screening.save(screening);
    router.push('/(onboarding)/contrato');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Steps current={4} badge={
          <View style={styles.required}>
            <HudLabel tone="red" style={{ fontSize: 10 }}>Obrigatório</HudLabel>
          </View>
        } />

        <View>
          <Txt variant="title">Triagem de Saúde</Txt>
          <Txt variant="bodySm" tone="blue" style={{ marginTop: 5, fontFamily: font.displayMedium }}>
            PAR-Q+ · versão brasileira validada
          </Txt>
        </View>
        <Txt variant="body" tone="dim" style={{ marginTop: -8 }}>
          Nenhum treino é liberado antes disso. Responda com honestidade — é o único jeito de o Sistema te proteger.
        </Txt>

        {QUESTIONS.map((q, i) => {
          const yes = answers[q.key] === true;
          return (
            <View key={q.key} style={[styles.card, yes && styles.cardFlagged]}>
              <Txt variant="body" style={{ marginBottom: 11 }}>
                <Txt variant="body" tone="muted" style={{ fontFamily: font.displayMedium }}>
                  {String(i + 1).padStart(2, '0')}
                </Txt>
                {'  '}{q.text}
              </Txt>
              <View style={styles.answerRow} accessibilityRole="radiogroup">
                <Pressable
                  accessibilityRole="radio" accessibilityState={{ selected: yes }} accessibilityLabel="Sim"
                  onPress={() => setAnswers((a) => ({ ...a, [q.key]: true }))}
                  style={[styles.answer, yes ? styles.answerYesOn : styles.answerYesOff]}
                >
                  <Txt tone={yes ? 'default' : 'red'} style={styles.answerText}>SIM</Txt>
                </Pressable>
                <Pressable
                  accessibilityRole="radio" accessibilityState={{ selected: !yes }} accessibilityLabel="Não"
                  onPress={() => setAnswers((a) => ({ ...a, [q.key]: false }))}
                  style={[styles.answer, !yes ? styles.answerNoOn : styles.answerNoOff]}
                >
                  <Txt tone={!yes ? 'default' : 'dim'} style={styles.answerText}>NÃO</Txt>
                </Pressable>
              </View>

              {yes && q.key === 'bone_joint' && (
                <View style={styles.followup}>
                  <HudLabel tone="red" style={{ fontSize: 12, marginBottom: 9 }}>Onde?</HudLabel>
                  <View style={styles.chips}>
                    {LIMITS.map((l) => {
                      const on = limits.includes(l.key);
                      return (
                        <Pressable
                          key={l.key}
                          accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                          accessibilityLabel={l.label}
                          onPress={() => setLimits((cur) =>
                            on ? cur.filter((x) => x !== l.key) : [...cur, l.key])}
                          style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                        >
                          <Txt variant="bodySm" tone={on ? 'default' : 'dim'} style={{ fontSize: 13 }}>
                            {l.label}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <Txt variant="bodySm" tone="muted" style={{ textAlign: 'center' }}>+ 4 perguntas</Txt>

        {screening.result !== 'cleared' && (
          <View style={styles.warning}>
            <IconAlert />
            <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
              {screening.result === 'blocked' ? (
                <>O Sistema <Txt variant="bodySm" tone="red">bloqueou a prescrição de treino</Txt>. Procure
                  um médico antes de continuar — só conteúdo educativo e caminhada leve ficam disponíveis.</>
              ) : (
                <>Você marcou {limits.length > 0 ? limits.map((l) => LIMITS.find((x) => x.key === l)?.label.toLowerCase()).join(', ') : 'uma condição'}. O
                  Sistema vai remover os exercícios contraindicados e ativar o{' '}
                  <Txt variant="bodySm" tone="default">Modo Prudência</Txt> até liberação médica.</>
              )}
            </Txt>
          </View>
        )}

        <SystemButton label="Continuar" onPress={submit} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.lg },
  required: {
    paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: 'rgba(255,59,92,0.14)', borderWidth: 1, borderColor: 'rgba(255,59,92,0.55)',
  },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, padding: 15 },
  cardFlagged: { backgroundColor: '#1C1030', borderColor: 'rgba(255,59,92,0.5)', borderLeftWidth: 3, borderLeftColor: color.red },
  answerRow: { flexDirection: 'row', gap: 8 },
  answer: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  answerText: { fontFamily: font.displayMedium, fontSize: 13, letterSpacing: 2 },
  answerYesOn: { backgroundColor: color.red, borderColor: color.redText },
  answerYesOff: { backgroundColor: color.redDim, borderColor: 'rgba(255,59,92,0.35)' },
  answerNoOn: { backgroundColor: color.purple, borderColor: color.purpleLight },
  answerNoOff: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  followup: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,59,92,0.35)', borderStyle: 'dashed' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 13, minHeight: 36, justifyContent: 'center', borderWidth: 1 },
  chipOn: { backgroundColor: color.red, borderColor: color.red },
  chipOff: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  warning: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13,
    backgroundColor: color.redDim, borderWidth: 1, borderColor: 'rgba(255,59,92,0.30)',
  },
});
