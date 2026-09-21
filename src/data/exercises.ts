import type { Exercise } from '../core/types';

/**
 * Seed de demonstração: 20 exercícios cobrindo as escadas completas de
 * empurrar, agachar, core, puxar e aeróbico. O catálogo dos 80 é a tarefa 28.
 *
 * `illustrations: null` num padrão de carga deixa o exercício BLOQUEADO
 * (R11.4) — é assim que a regra aparece no Códice hoje.
 */
const ill = (slug: string) => ({ start: `illus/${slug}_start`, end: `illus/${slug}_end` });

export const EXERCISES: Exercise[] = [
  // ── Empurrar horizontal ────────────────────────────────────────────────
  {
    id: 'push_wall', namePt: 'Flexão na parede', nameEn: 'Wall push-up',
    systemNamePt: 'Golpe Básico I', pattern: 'push_h', difficulty: 1, minRank: 'E',
    unit: 'reps', equipment: ['none'], contraindications: ['wrist'],
    regressionId: null, progressionId: 'push_bench',
    cues: [
      'Corpo em linha reta da cabeça ao calcanhar',
      'Cotovelos a 45° do tronco, não abertos a 90°',
      'Desce em 2 segundos, sobe em 1',
    ],
    commonErrors: ['Quadril caindo ou empinado', 'Amplitude parcial — o peito precisa chegar perto da parede'],
    illustrations: ill('push_wall'),
    progressionCriteria: '2 séries de 15 com boa forma, em 2 sessões seguidas',
    attribute: 'STR',
  },
  {
    id: 'push_bench', namePt: 'Flexão na bancada', nameEn: 'Bench push-up',
    systemNamePt: 'Golpe Básico II', pattern: 'push_h', difficulty: 2, minRank: 'E',
    unit: 'reps', equipment: ['none'], contraindications: ['wrist'],
    regressionId: 'push_wall', progressionId: 'push_knee',
    cues: ['Mãos na largura dos ombros', 'Escápulas retraídas no início', 'Quadril acompanha o tronco'],
    commonErrors: ['Apoio instável', 'Cabeça projetada à frente'],
    illustrations: ill('push_bench'),
    progressionCriteria: '2 séries de 12 com boa forma',
    attribute: 'STR',
  },
  {
    id: 'push_knee', namePt: 'Flexão de joelhos', nameEn: 'Knee push-up',
    systemNamePt: 'Golpe Básico III', pattern: 'push_h', difficulty: 3, minRank: 'D',
    unit: 'reps', equipment: ['none'], contraindications: ['wrist', 'knee'],
    regressionId: 'push_bench', progressionId: 'push_negative',
    cues: ['Linha reta do joelho à cabeça', 'Peito toca antes do quadril', 'Cotovelos para trás, não para os lados'],
    commonErrors: ['Sentar nos calcanhares', 'Descer só metade'],
    illustrations: ill('push_knee'),
    progressionCriteria: '2 séries de 15 com boa forma',
    attribute: 'STR',
  },
  {
    id: 'push_negative', namePt: 'Negativa lenta', nameEn: 'Negative push-up',
    systemNamePt: 'Golpe Contido', pattern: 'push_h', difficulty: 4, minRank: 'D',
    unit: 'reps', equipment: ['none'], contraindications: ['wrist'],
    regressionId: 'push_knee', progressionId: 'push_full',
    cues: ['4 segundos para descer', 'Volta apoiando os joelhos', 'Core firme o tempo todo'],
    commonErrors: ['Descer rápido demais', 'Perder a linha do quadril no fim'],
    illustrations: ill('push_negative'),
    progressionCriteria: '3 séries de 5 negativas controladas',
    attribute: 'STR',
  },
  {
    id: 'push_full', namePt: 'Flexão completa', nameEn: 'Full push-up',
    systemNamePt: 'Golpe Pleno', pattern: 'push_h', difficulty: 5, minRank: 'C',
    unit: 'reps', equipment: ['none'], contraindications: ['wrist'],
    regressionId: 'push_negative', progressionId: 'push_feet_elevated',
    cues: ['Corpo rígido como uma prancha', 'Peito a um punho do chão', 'Empurra o chão para longe'],
    commonErrors: ['Quadril caindo', 'Pescoço projetado'],
    illustrations: ill('push_full'),
    progressionCriteria: '3 séries de 12',
    attribute: 'STR',
  },
  {
    id: 'push_feet_elevated', namePt: 'Flexão com pés elevados', nameEn: 'Feet-elevated push-up',
    systemNamePt: 'Golpe Ascendente', pattern: 'push_h', difficulty: 7, minRank: 'B',
    unit: 'reps', equipment: ['none'], contraindications: ['wrist', 'shoulder'],
    regressionId: 'push_full', progressionId: null,
    cues: ['Pés numa superfície estável', 'Mesma linha de corpo da flexão comum', 'Controle na descida'],
    commonErrors: ['Elevar demais e virar exercício de ombro'],
    illustrations: null, // ← bloqueado até a ilustração existir (R11.4)
    progressionCriteria: '3 séries de 10',
    attribute: 'STR',
  },

  // ── Agachar ────────────────────────────────────────────────────────────
  {
    id: 'squat_chair', namePt: 'Sentar e levantar da cadeira', nameEn: 'Sit-to-stand',
    systemNamePt: 'Postura de Base I', pattern: 'squat', difficulty: 1, minRank: 'E',
    unit: 'reps', equipment: ['none'], contraindications: [],
    regressionId: null, progressionId: 'squat_box',
    cues: ['Pés na largura do quadril', 'Joelhos apontam na direção dos pés', 'Levanta empurrando o chão com o calcanhar'],
    commonErrors: ['Impulsionar com os braços', 'Joelho colapsando para dentro'],
    illustrations: ill('squat_chair'),
    progressionCriteria: '2 séries de 15 sem apoio das mãos',
    attribute: 'STR',
  },
  {
    id: 'squat_box', namePt: 'Agachamento em caixa', nameEn: 'Box squat',
    systemNamePt: 'Postura de Base II', pattern: 'squat', difficulty: 2, minRank: 'E',
    unit: 'reps', equipment: ['none'], contraindications: [],
    regressionId: 'squat_chair', progressionId: 'squat_partial',
    cues: ['Toca a caixa sem sentar o peso', 'Peito aberto', 'Quadril vai para trás primeiro'],
    commonErrors: ['Desabar na caixa', 'Calcanhar saindo do chão'],
    illustrations: ill('squat_box'),
    progressionCriteria: '2 séries de 15',
    attribute: 'STR',
  },
  {
    id: 'squat_partial', namePt: 'Agachamento livre parcial', nameEn: 'Partial squat',
    systemNamePt: 'Postura Firme', pattern: 'squat', difficulty: 3, minRank: 'D',
    unit: 'reps', equipment: ['none'], contraindications: ['knee'],
    regressionId: 'squat_box', progressionId: 'squat_full',
    cues: ['Desce até onde a lombar mantém a curva', 'Peso distribuído no pé inteiro', 'Sobe sem travar o joelho'],
    commonErrors: ['Lombar arredondando no fundo', 'Joelho para dentro'],
    illustrations: ill('squat_partial'),
    progressionCriteria: '3 séries de 15',
    attribute: 'STR',
  },
  {
    id: 'squat_full', namePt: 'Agachamento livre completo', nameEn: 'Bodyweight squat',
    systemNamePt: 'Postura do Caçador', pattern: 'squat', difficulty: 4, minRank: 'C',
    unit: 'reps', equipment: ['none'], contraindications: ['knee'],
    regressionId: 'squat_partial', progressionId: 'squat_bulgarian',
    cues: ['Coxa paralela ao chão', 'Joelhos acompanham a ponta dos pés', 'Tronco e canela em ângulos parecidos'],
    commonErrors: ['Calcanhar levantando', 'Descer rápido e quicar no fundo'],
    illustrations: ill('squat_full'),
    progressionCriteria: '3 séries de 20',
    attribute: 'STR',
  },
  {
    id: 'squat_bulgarian', namePt: 'Agachamento búlgaro', nameEn: 'Bulgarian split squat',
    systemNamePt: 'Postura Partida', pattern: 'unilateral', difficulty: 6, minRank: 'B',
    unit: 'reps', equipment: ['none'], contraindications: ['knee'],
    regressionId: 'squat_full', progressionId: null,
    cues: ['Pé de trás apoiado num banco', 'Peso no pé da frente', 'Desce reto, não para frente'],
    commonErrors: ['Passada curta demais', 'Tronco caindo à frente'],
    illustrations: ill('squat_bulgarian'),
    progressionCriteria: '3 séries de 10 por perna',
    attribute: 'STR',
  },

  // ── Core ───────────────────────────────────────────────────────────────
  {
    id: 'plank_knee', namePt: 'Prancha de joelhos', nameEn: 'Knee plank',
    systemNamePt: 'Guarda de Ferro I', pattern: 'core_anti_ext', difficulty: 2, minRank: 'E',
    unit: 'seconds', equipment: ['none'], contraindications: ['lower_back'],
    regressionId: null, progressionId: 'plank_full',
    cues: ['Cotovelos sob os ombros', 'Umbigo puxado para dentro', 'Glúteos contraídos'],
    commonErrors: ['Quadril alto demais', 'Lombar cedendo'],
    illustrations: ill('plank_knee'),
    progressionCriteria: '2 × 30 segundos com lombar neutra',
    attribute: 'PER',
  },
  {
    id: 'plank_full', namePt: 'Prancha completa', nameEn: 'Full plank',
    systemNamePt: 'Guarda de Ferro II', pattern: 'core_anti_ext', difficulty: 4, minRank: 'D',
    unit: 'seconds', equipment: ['none'], contraindications: ['lower_back', 'shoulder'],
    regressionId: 'plank_knee', progressionId: 'side_plank',
    cues: ['Linha reta da cabeça ao calcanhar', 'Respira sem soltar o core', 'Ombros longe das orelhas'],
    commonErrors: ['Prender a respiração', 'Quadril subindo com o cansaço'],
    illustrations: ill('plank_full'),
    progressionCriteria: '3 × 45 segundos',
    attribute: 'PER',
  },
  {
    id: 'dead_bug', namePt: 'Dead bug', nameEn: 'Dead bug',
    systemNamePt: 'Guarda Invertida', pattern: 'core_anti_ext', difficulty: 3, minRank: 'E',
    unit: 'reps', equipment: ['none'], contraindications: [],
    regressionId: 'plank_knee', progressionId: 'plank_full',
    cues: ['Lombar colada no chão', 'Move braço e perna opostos', 'Devagar, sem perder o contato lombar'],
    commonErrors: ['Lombar arqueando', 'Movimento rápido demais'],
    illustrations: ill('dead_bug'),
    progressionCriteria: '3 × 10 por lado',
    attribute: 'PER',
  },
  {
    id: 'side_plank', namePt: 'Prancha lateral', nameEn: 'Side plank',
    systemNamePt: 'Guarda Lateral', pattern: 'core_anti_rot', difficulty: 5, minRank: 'C',
    unit: 'seconds', equipment: ['none'], contraindications: ['shoulder'],
    regressionId: 'plank_full', progressionId: null,
    cues: ['Cotovelo sob o ombro', 'Quadril alto', 'Corpo num plano só'],
    commonErrors: ['Quadril caindo', 'Rotação do tronco'],
    illustrations: ill('side_plank'),
    progressionCriteria: '3 × 30 segundos por lado',
    attribute: 'PER',
  },

  // ── Puxar ──────────────────────────────────────────────────────────────
  {
    id: 'row_band', namePt: 'Remada com elástico', nameEn: 'Band row',
    systemNamePt: 'Tração I', pattern: 'pull_h', difficulty: 2, minRank: 'E',
    unit: 'reps', equipment: ['band'], contraindications: ['shoulder'],
    regressionId: null, progressionId: 'row_table',
    cues: ['Puxa com o cotovelo, não com a mão', 'Escápulas se aproximam', 'Tronco parado'],
    commonErrors: ['Encolher os ombros', 'Usar o tronco para puxar'],
    illustrations: ill('row_band'),
    progressionCriteria: '3 × 15 com elástico médio',
    attribute: 'STR',
  },
  {
    id: 'row_table', namePt: 'Remada na mesa', nameEn: 'Table row',
    systemNamePt: 'Tração II', pattern: 'pull_h', difficulty: 4, minRank: 'D',
    unit: 'reps', equipment: ['none'], contraindications: ['shoulder'],
    regressionId: 'row_band', progressionId: 'row_australian',
    cues: ['Corpo em linha reta', 'Peito toca a borda', 'Desce controlado'],
    commonErrors: ['Quadril caindo', 'Amplitude curta'],
    illustrations: ill('row_table'),
    progressionCriteria: '3 × 12',
    attribute: 'STR',
  },
  {
    id: 'row_australian', namePt: 'Remada australiana', nameEn: 'Australian row',
    systemNamePt: 'Tração Plena', pattern: 'pull_h', difficulty: 6, minRank: 'C',
    unit: 'reps', equipment: ['pullup_bar', 'gym'], contraindications: ['shoulder'],
    regressionId: 'row_table', progressionId: null,
    cues: ['Barra na altura do quadril', 'Corpo rígido', 'Peito encosta na barra'],
    commonErrors: ['Quadril cedendo', 'Puxar só com o braço'],
    illustrations: ill('row_australian'),
    progressionCriteria: '3 × 10',
    attribute: 'STR',
  },

  // ── Aeróbico e mobilidade ──────────────────────────────────────────────
  {
    id: 'walk', namePt: 'Caminhada', nameEn: 'Walk',
    systemNamePt: 'Marcha', pattern: 'aerobic', difficulty: 1, minRank: 'E',
    unit: 'minutes', equipment: ['none'], contraindications: [],
    regressionId: null, progressionId: 'walk_brisk',
    cues: ['Ritmo em que dá para falar frases curtas', 'Passada natural', 'Ombros relaxados'],
    commonErrors: ['Começar rápido demais e parar cedo'],
    illustrations: null,
    progressionCriteria: '20 minutos contínuos sem pausa',
    attribute: 'AGI',
  },
  {
    id: 'walk_brisk', namePt: 'Caminhada rápida', nameEn: 'Brisk walk',
    systemNamePt: 'Marcha Forçada', pattern: 'aerobic', difficulty: 3, minRank: 'D',
    unit: 'minutes', equipment: ['none'], contraindications: [],
    regressionId: 'walk', progressionId: 'run_walk',
    cues: ['Respiração audível mas controlada', 'Braços acompanham', 'Não consegue cantar, consegue conversar'],
    commonErrors: ['Confundir rápido com corrida'],
    illustrations: null,
    progressionCriteria: '30 minutos contínuos',
    attribute: 'AGI',
  },
  {
    id: 'run_walk', namePt: 'Corrida intercalada', nameEn: 'Run-walk',
    systemNamePt: 'Avanço', pattern: 'aerobic', difficulty: 5, minRank: 'C',
    unit: 'minutes', equipment: ['none'], contraindications: ['knee'],
    regressionId: 'walk_brisk', progressionId: null,
    cues: ['1 minuto correndo, 2 caminhando', 'Passada curta', 'Pisa sob o corpo, não à frente'],
    commonErrors: ['Correr rápido demais nos intervalos'],
    illustrations: null,
    progressionCriteria: '5 km sem parar de se mover',
    attribute: 'AGI',
  },
  {
    id: 'cat_camel', namePt: 'Gato-camelo', nameEn: 'Cat-camel',
    systemNamePt: 'Fluxo Vertebral', pattern: 'mobility', difficulty: 1, minRank: 'E',
    unit: 'reps', equipment: ['none'], contraindications: [],
    regressionId: null, progressionId: null,
    cues: ['Move vértebra por vértebra', 'Sem forçar o fim da amplitude', 'Acompanha a respiração'],
    commonErrors: ['Movimento rápido', 'Forçar a lombar'],
    illustrations: ill('cat_camel'),
    progressionCriteria: 'Mobilidade, não progride por carga',
    attribute: 'PER',
  },
];

export const exerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id);

/** Escada completa de um padrão, da regressão mais simples à mais difícil. */
export function ladderFor(exerciseId: string): Exercise[] {
  const start = exerciseById(exerciseId);
  if (!start) return [];
  const chain: Exercise[] = [start];
  let cur = start;
  while (cur.regressionId) {
    const prev = exerciseById(cur.regressionId);
    if (!prev) break;
    chain.unshift(prev);
    cur = prev;
  }
  cur = start;
  while (cur.progressionId) {
    const next = exerciseById(cur.progressionId);
    if (!next) break;
    chain.push(next);
    cur = next;
  }
  return chain;
}
