import { View } from 'react-native';
import type { Rank } from '../core/types';
import { Txt } from './Text';
import { color } from './tokens';

const SIZES = { sm: { box: 48, font: 24 }, md: { box: 62, font: 30 }, lg: { box: 88, font: 46 } };

export function RankBadge({
  rank, size = 'md', dimmed = false,
}: { rank: Rank; size?: keyof typeof SIZES; dimmed?: boolean }) {
  const s = SIZES[size];
  const accent = rank === 'S' ? color.gold : color.purpleLight;

  return (
    <View
      accessibilityLabel={`Rank ${rank}`}
      style={{
        width: s.box, height: s.box, alignItems: 'center', justifyContent: 'center',
        backgroundColor: dimmed ? 'transparent' : 'rgba(139,92,246,0.18)',
        borderWidth: 1,
        borderColor: dimmed ? color.purpleBorder : accent,
        shadowColor: accent,
        shadowOpacity: dimmed ? 0 : 0.5,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Txt variant="statLg" tone={dimmed ? 'locked' : 'default'}
        style={{ fontSize: s.font, lineHeight: s.font * 1.05 }}>
        {rank}
      </Txt>
      {size !== 'sm' && <Txt variant="hudSmall" tone="purple" style={{ marginTop: 2 }}>Rank</Txt>}
    </View>
  );
}
