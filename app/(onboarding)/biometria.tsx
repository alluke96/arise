import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HudLabel, IconInfo, Screen, SystemButton, SystemWindow, Txt,
  TOUCH_MIN, color, font, space,
} from '../../src/ui';
import { useProgression } from '../../src/features/progression/store';
import { Steps } from '../../src/features/onboarding/Steps';

type Gender = 'male' | 'female' | 'unspecified';

export default function Biometria() {
  const router = useRouter();
  const { profile, setProfile } = useProgression();
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [weight, setWeight] = useState(String(profile.weightKg).replace('.', ','));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [waist, setWaist] = useState(profile.waistCm ? String(profile.waistCm) : '');

  // R1.7 — faixas válidas. R1.8 bloqueia menores de 16.
  const ageValid = age >= 16 && age <= 90;

  const submit = async () => {
    await setProfile({
      age,
      gender,
      weightKg: Number(weight.replace(',', '.')) || profile.weightKg,
      heightCm: Number(height) || profile.heightCm,
      waistCm: waist ? Number(waist) : null,
    });
    router.push('/(onboarding)/triagem');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Steps current={3} onBack={() => router.back()} />

        <Txt variant="title" style={styles.title}>Registro na{'\n'}Associação</Txt>
        <Txt variant="body" tone="dim" style={styles.sub}>
          O Sistema precisa destes dados para calibrar sua Missão Diária e estimar seu gasto energético.
        </Txt>

        <SystemWindow padding={14} glow={false}>
          <View style={styles.ageRow}>
            <HudLabel tone="blue" style={{ fontSize: 12 }}>Idade</HudLabel>
            <View style={styles.stepper}>
              <Pressable accessibilityRole="button" accessibilityLabel="Diminuir idade"
                onPress={() => setAge((a) => Math.max(16, a - 1))} style={styles.stepBtn}>
                <Txt style={styles.stepSign}>−</Txt>
              </Pressable>
              <Txt variant="stat" style={styles.ageValue}>{age}</Txt>
              <Pressable accessibilityRole="button" accessibilityLabel="Aumentar idade"
                onPress={() => setAge((a) => Math.min(90, a + 1))} style={styles.stepBtn}>
                <Txt style={styles.stepSign}>+</Txt>
              </Pressable>
            </View>
          </View>
        </SystemWindow>

        {!ageValid && (
          <Txt variant="bodySm" tone="red">
            O app é liberado a partir dos 16 anos.
          </Txt>
        )}

        <View>
          <HudLabel tone="blue" style={styles.fieldLabel}>Gênero</HudLabel>
          <View style={styles.genderRow} accessibilityRole="radiogroup">
            {([['male', 'Masculino'], ['female', 'Feminino'], ['unspecified', '…']] as const).map(([v, label]) => (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === v }}
                accessibilityLabel={v === 'unspecified' ? 'Prefiro não informar' : label}
                onPress={() => setGender(v)}
                style={[
                  styles.pill,
                  v === 'unspecified' && { flexGrow: 0, width: 52 },
                  gender === v ? styles.pillOn : styles.pillOff,
                ]}
              >
                <Txt variant="bodySm" tone={gender === v ? 'default' : 'dim'}
                  style={{ fontFamily: font.displayMedium, fontSize: 13 }}>{label}</Txt>
              </Pressable>
            ))}
          </View>
          {gender === 'unspecified' && (
            <Txt variant="bodySm" tone="muted" style={styles.hint}>
              O Sistema usa a média das constantes no cálculo de TMB.
            </Txt>
          )}
        </View>

        <View style={styles.pairRow}>
          <Field label="Peso" value={weight} onChange={setWeight} unit="kg" id="peso" />
          <Field label="Altura" value={height} onChange={setHeight} unit="cm" id="altura" />
        </View>

        <View>
          <HudLabel tone="blue" style={styles.fieldLabel}>
            Cintura <Txt variant="bodySm" tone="muted">— opcional</Txt>
          </HudLabel>
          <View style={[styles.input, styles.inputDashed]}>
            <TextInput
              accessibilityLabel="Circunferência de cintura em centímetros"
              value={waist} onChangeText={setWaist} keyboardType="numeric"
              placeholder="—" placeholderTextColor={color.textMuted} style={styles.inputText}
            />
            <Txt variant="bodySm" tone="muted">cm</Txt>
          </View>
          <Txt variant="bodySm" tone="muted" style={styles.hint}>
            Marcador de risco melhor que o IMC. Vira um gráfico de progresso.
          </Txt>
        </View>

        <View style={styles.note}>
          <IconInfo />
          <Txt variant="bodySm" tone="dim" style={{ flex: 1 }}>
            Ficam <Txt variant="bodySm" tone="default">só no seu aparelho</Txt>. Alimentam a
            fórmula de Mifflin-St Jeor e a carga inicial.
          </Txt>
        </View>

        <SystemButton label="Continuar" onPress={submit} disabled={!ageValid} />
      </ScrollView>
    </Screen>
  );
}

function Field({ label, value, onChange, unit, id }: {
  label: string; value: string; onChange: (v: string) => void; unit: string; id: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <HudLabel tone="blue" style={styles.fieldLabel}>{label}</HudLabel>
      <View style={styles.input}>
        <TextInput
          accessibilityLabel={`${label} em ${unit}`}
          nativeID={id} value={value} onChangeText={onChange}
          keyboardType="numeric" style={styles.inputText}
        />
        <Txt variant="bodySm" tone="muted">{unit}</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: 40, gap: space.lg },
  title: { marginTop: 6 },
  sub: { marginTop: -6 },
  ageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.purpleDim, borderWidth: 1, borderColor: color.purpleBorder,
  },
  stepSign: { color: color.purpleSoft, fontSize: 20, fontFamily: font.body },
  ageValue: { width: 62, textAlign: 'center', fontSize: 30 },
  fieldLabel: { fontSize: 12, marginBottom: 9 },
  genderRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pillOn: { backgroundColor: color.purple, borderColor: color.purpleLight },
  pillOff: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  pairRow: { flexDirection: 'row', gap: 10 },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 14,
    backgroundColor: color.surfaceRaised, borderWidth: 1, borderColor: color.purpleBorder,
  },
  inputDashed: { borderStyle: 'dashed' },
  inputText: { flex: 1, color: color.text, fontSize: 23, fontFamily: font.displayMedium },
  hint: { marginTop: 8 },
  note: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12,
    backgroundColor: color.blueDim, borderLeftWidth: 2, borderLeftColor: color.blue,
  },
});
