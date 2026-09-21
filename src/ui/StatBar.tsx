import { View } from 'react-native';
import { color } from './tokens';

export function StatBar({
  ratio, height = 5, fill = color.blue, glow = true,
}: { ratio: number; height?: number; fill?: string; glow?: boolean }) {
  const pct = Math.min(Math.max(ratio, 0), 1) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height, backgroundColor: color.track, overflow: 'hidden' }}
    >
      <View
        style={[
          { width: `${pct}%`, height, backgroundColor: fill },
          glow && { shadowColor: fill, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
        ]}
      />
    </View>
  );
}
