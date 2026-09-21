import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color } from './tokens';

type Tone = 'default' | 'penalty' | 'ritual';

const HALO: Record<Tone, { c: string; opacity: number; cy: string }> = {
  default: { c: '#7C3AED', opacity: 0.34, cy: '-6%' },
  penalty: { c: '#FF3B5C', opacity: 0.3, cy: '26%' },
  ritual: { c: '#A78BFA', opacity: 0.44, cy: '34%' },
};

/** Fundo do app: halo radial no topo + malha de 26px. Textura de HUD sem
 *  virar wash de gradiente. */
export function Screen({
  children, tone = 'default', edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  tone?: Tone;
  edges?: ('top' | 'bottom')[];
}) {
  const halo = HALO[tone];
  const bg = tone === 'penalty' ? '#150410' : tone === 'ritual' ? color.bgDeep : color.bg;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy={halo.cy} rx="80%" ry="46%">
            <Stop offset="0" stopColor={halo.c} stopOpacity={halo.opacity} />
            <Stop offset="1" stopColor={halo.c} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#halo)" />
        {Array.from({ length: 34 }, (_, i) => (
          <Line key={`h${i}`} x1="0" y1={i * 26} x2="100%" y2={i * 26}
            stroke={halo.c} strokeOpacity={0.05} strokeWidth={1} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <Line key={`v${i}`} x1={i * 26} y1="0" x2={i * 26} y2="100%"
            stroke={halo.c} strokeOpacity={0.05} strokeWidth={1} />
        ))}
      </Svg>
      <SafeAreaView style={styles.safe} edges={edges}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
});
