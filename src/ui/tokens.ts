/**
 * Fonte única de verdade visual. Nenhum hex solto em componente.
 *
 * Regra de cor: roxo carrega a interface, azul claro marca DADO,
 * vermelho só onde há urgência ou risco real. Verde só "concluído",
 * dourado só Rank S / General. Se o vermelho aparecer em toda tela,
 * ele para de significar alguma coisa.
 */
export const color = {
  bg: '#0C0618',
  bgDeep: '#09041A',
  surface: '#150C2B',
  surfaceAlt: '#100822',
  surfaceRaised: '#170D2E',

  purple: '#7C3AED',
  purpleLight: '#A78BFA',
  purpleSoft: '#C4B5FD',
  purpleDim: 'rgba(139,92,246,0.10)',
  purpleBorder: 'rgba(139,92,246,0.32)',
  purpleGlow: 'rgba(124,58,237,0.55)',

  blue: '#7DD3FC',
  blueDim: 'rgba(125,211,252,0.08)',
  blueBorder: 'rgba(125,211,252,0.38)',

  red: '#FF3B5C',
  redText: '#FF6B85',
  redDim: 'rgba(255,59,92,0.08)',
  redBorder: 'rgba(255,59,92,0.34)',

  gold: '#FBBF24',
  green: '#4ADE80',
  greenDim: 'rgba(74,222,128,0.06)',
  greenBorder: 'rgba(74,222,128,0.28)',

  text: '#F3EFFF',
  textDim: '#ADA2CC',
  textMuted: '#8A7EAE',
  textLocked: '#6B5E93',

  line: 'rgba(139,92,246,0.30)',
  track: 'rgba(139,92,246,0.22)',
} as const;

export const font = {
  display: 'ChakraPetch_600SemiBold',
  displayBold: 'ChakraPetch_700Bold',
  displayMedium: 'ChakraPetch_500Medium',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const;

/** Alvo mínimo de toque. O usuário interage suado, ofegante, com o celular
 *  no chão — 44pt não é recomendação aqui, é requisito. */
export const TOUCH_MIN = 44;

export const radius = { none: 0, chamfer: 13 } as const;

export const type = {
  hudLabel: { fontFamily: font.displayMedium, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase' as const },
  hudSmall: { fontFamily: font.displayMedium, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' as const },
  title: { fontFamily: font.displayBold, fontSize: 23, letterSpacing: 1.4 },
  titleLg: { fontFamily: font.displayBold, fontSize: 32, letterSpacing: 1.6 },
  stat: { fontFamily: font.displayBold, fontSize: 20 },
  statLg: { fontFamily: font.displayBold, fontSize: 46 },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 21 },
  bodySm: { fontFamily: font.body, fontSize: 12, lineHeight: 18 },
  bodyStrong: { fontFamily: font.bodySemi, fontSize: 15 },
} as const;
