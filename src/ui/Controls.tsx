import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { IconBack } from './icons';
import { HudLabel, Txt } from './Text';
import { TOUCH_MIN, color, font } from './tokens';

/** Cabeçalho com voltar. O alvo de toque tem 44pt mesmo com ícone pequeno. */
export function Header({ title, onBack, backLabel, right }: {
  title?: string; onBack?: () => void; backLabel: string; right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel={backLabel}
          onPress={onBack} style={styles.back}>
          <IconBack />
        </Pressable>
      )}
      {title ? <Txt variant="title" style={styles.headerTitle} numberOfLines={1}>{title}</Txt> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

export interface Option<T extends string | number> { value: T; label: string; hint?: string }

/** Escolha única em pílulas. Semântica de radiogroup para leitor de tela. */
export function Choice<T extends string | number>({ options, value, onChange, tone = 'purple', columns }: {
  options: Option<T>[]; value: T; onChange: (v: T) => void;
  tone?: 'purple' | 'red'; columns?: number;
}) {
  return (
    <View style={[styles.choice, columns ? styles.choiceWrap : null]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.hint ? `${o.label}. ${o.hint}` : o.label}
            onPress={() => onChange(o.value)}
            style={[
              styles.pill,
              columns ? { width: `${100 / columns - 2}%` } : { flex: 1 },
              on ? (tone === 'red' ? styles.pillRed : styles.pillOn) : styles.pillOff,
            ]}
          >
            <Txt variant="bodySm" tone={on ? 'default' : 'dim'} numberOfLines={2}
              style={styles.pillText}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Escolha múltipla. */
export function MultiChoice<T extends string>({ options, values, onToggle, tone = 'purple' }: {
  options: Option<T>[]; values: T[]; onToggle: (v: T) => void; tone?: 'purple' | 'red';
}) {
  return (
    <View style={styles.multi}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <Pressable
            key={o.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            onPress={() => onToggle(o.value)}
            style={[styles.chip, on ? (tone === 'red' ? styles.pillRed : styles.pillOn) : styles.pillOff]}
          >
            <Txt variant="bodySm" tone={on ? 'default' : 'dim'} style={{ fontSize: 13 }}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ label, value, onChange, min, max, step = 1, suffix, decLabel, incLabel }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; suffix?: string; decLabel: string; incLabel: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  return (
    <View style={styles.stepperRow}>
      <HudLabel tone="blue" style={{ fontSize: 12, flex: 1 }}>{label}</HudLabel>
      <View style={styles.stepper}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${decLabel} ${label}`}
          onPress={() => onChange(clamp(value - step))} style={styles.stepBtn}>
          <Txt style={styles.stepSign}>−</Txt>
        </Pressable>
        <Txt variant="stat" style={styles.stepValue} accessibilityLiveRegion="polite">
          {value}{suffix ? <Txt variant="bodySm" tone="muted"> {suffix}</Txt> : null}
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel={`${incLabel} ${label}`}
          onPress={() => onChange(clamp(value + step))} style={styles.stepBtn}>
          <Txt style={styles.stepSign}>+</Txt>
        </Pressable>
      </View>
    </View>
  );
}

export function Toggle({ label, value, onChange, note }: {
  label: string; value: boolean; onChange: (v: boolean) => void; note?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Txt variant="body">{label}</Txt>
        {note ? <Txt variant="bodySm" tone="muted" style={{ marginTop: 2 }}>{note}</Txt> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: color.track, true: color.purple }}
        thumbColor={value ? color.purpleSoft : color.textMuted}
      />
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.toggleRow}>
      <Txt variant="body" tone="dim" style={{ flex: 1 }}>{label}</Txt>
      <Txt variant="bodySm">{value}</Txt>
    </View>
  );
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <HudLabel tone="muted">{label}</HudLabel>
      {children}
    </View>
  );
}

/** Aviso com barra lateral. Azul informa, vermelho alerta. */
export function Note({ children, tone = 'blue', icon }: {
  children: ReactNode; tone?: 'blue' | 'red'; icon?: ReactNode;
}) {
  return (
    <View style={[styles.note, tone === 'red' ? styles.noteRed : styles.noteBlue]}>
      {icon}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: TOUCH_MIN },
  back: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
  headerTitle: { flex: 1, fontSize: 19 },
  choice: { flexDirection: 'row', gap: 8 },
  choiceWrap: { flexWrap: 'wrap' },
  pill: { minHeight: 46, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pillText: { fontFamily: font.displayMedium, fontSize: 13, textAlign: 'center' },
  pillOn: { backgroundColor: color.purple, borderColor: color.purpleLight },
  pillRed: { backgroundColor: color.red, borderColor: color.redText },
  pillOff: { backgroundColor: color.purpleDim, borderColor: color.purpleBorder },
  multi: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderWidth: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.purpleDim, borderWidth: 1, borderColor: color.purpleBorder,
  },
  stepSign: { color: color.purpleSoft, fontSize: 20, fontFamily: font.body },
  stepValue: { minWidth: 70, textAlign: 'center', fontSize: 24 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 },
  section: { gap: 10 },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13, borderLeftWidth: 2 },
  noteBlue: { backgroundColor: color.blueDim, borderLeftColor: color.blue },
  noteRed: { backgroundColor: color.redDim, borderLeftColor: color.red },
});
