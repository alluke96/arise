/**
 * English condition and perk for every shadow, keyed by id. Names live in
 * `shadows.ts` (`en` field); the catalog test requires an entry per shadow.
 */
export const SHADOWS_EN: Record<string, { condition: string; perk: string }> = {
  // Soldier
  sentinela: { condition: 'First quest completed', perk: 'Unlocks notification customization' },
  batedor: { condition: '7-day streak', perk: '+10% XP for 7 days' },
  sabujo: { condition: '10,000 steps in one day', perk: 'Step widget on the Status screen' },
  arauto: { condition: 'Read 3 Codex articles', perk: 'Unlocks advanced explanations' },
  lanceiro: { condition: 'Complete 10 sessions', perk: 'Unlocks the history chart' },
  vigia_noturno: { condition: 'Train after 9 pm 5 times', perk: 'Reduced-contrast theme for night training' },
  madrugador: { condition: 'Train before 7 am 5 times', perk: 'Morning reminder with the quest already open' },
  peregrino: { condition: 'Walk 50 km in total', perk: 'Map of favorite routes' },

  // Elite
  guarda: { condition: '30 sessions completed', perk: 'Unlocks the manual plan editor' },
  vigia: { condition: '4 weeks without skipping a training day', perk: '+1 Recovery Stone per month' },
  ferreiro: { condition: 'Progress on 5 different exercises', perk: 'Shows the full ladder in the Codex' },
  sobrevivente: { condition: 'Complete 3 Penalty Zones', perk: 'Penalty Zone lets you choose the exercise' },
  retornado: { condition: 'Return from a Dungeon Break and train 2 weeks in a row', perk: 'Gentler re-entry protocol next time' },
  cartografo: { condition: 'Log weight and waist for 4 weeks', perk: 'Body composition chart' },
  disciplinado: { condition: 'Complete a deload week without skipping', perk: 'Periodization visible on the calendar' },
  arqueiro: { condition: 'First full Australian row', perk: 'Unlocks pulling variations' },

  // Knight
  carmesim: { condition: 'First full push-up on the floor', perk: 'Unlocks the Flames visual theme' },
  berserker: { condition: 'Complete a Red Gate', perk: 'Unlocks the HIIT library' },
  andarilho: { condition: '7,000 steps for 30 days in a row', perk: 'Adaptive step goal' },
  escalador: { condition: 'First full pull-up', perk: 'Unlocks bar progressions' },
  corredor: { condition: 'First continuous 5 km', perk: 'Pace-based running plans' },
  inabalavel: { condition: '60-day streak', perk: '+2 Recovery Stones per month' },
  'centurião': { condition: '100 sessions completed', perk: 'Title shown on your profile' },
  pedra_angular: { condition: '2-minute plank', perk: 'Unlocks advanced core' },
  pilar: { condition: '50 bodyweight squats in a row', perk: 'Unlocks loaded squats' },
  martelo: { condition: '30 full push-ups in a row', perk: 'Unlocks pushing variations' },

  // Commander
  estrategista: { condition: 'Plan 8 weeks in a row', perk: 'Training block planner' },
  veterano: { condition: '6 months of continuous use', perk: 'Annual progress report' },
  mentor: { condition: 'Invite someone who trains for 4 weeks', perk: 'Create a guild with up to 15 members' },
  guardiao: { condition: 'No injury logged in 6 months', perk: 'Load and recovery analysis' },
  incansavel: { condition: '120-day streak', perk: 'Permanent weekly Recovery Stone' },
  colecionador: { condition: 'Master 40 different exercises', perk: 'Full Codex unlocked' },

  // Marshal
  marechal: { condition: 'Reach Rank B', perk: 'Unlocks advanced periodization' },
  senhor_da_guerra: { condition: 'Reach Rank A', perk: 'Unlocks the Canonical Quest in blocks' },
  imortal: { condition: '365-day streak', perk: 'Permanent profile frame' },
  arquiteto: { condition: 'Create and follow your own plan for 12 weeks', perk: 'Full program editor' },

  // General
  general: { condition: 'Reach Rank S', perk: 'Permanent title and gold theme' },
  monarca: { condition: 'Hold Rank S for 12 weeks', perk: 'Veterans Hall and exclusive cosmetic' },
  preparacao: { condition: '100 push-ups, 100 sit-ups, 100 squats and 10 km in one day', perk: 'The canonical quest, complete' },
  primeiro: { condition: 'Look back and see the Rank E you came from', perk: 'Full timeline of your journey' },
};
