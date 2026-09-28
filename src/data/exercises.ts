import type { Exercise, Pattern, Rank } from '../core/types';
import { EXERCISES_EN } from './exercises.en';

/**
 * Catálogo completo — 80 exercícios.
 *
 * O que importa aqui não é a quantidade: é a ESCADA. O erro central dos apps
 * genéricos é oferecer só o movimento padrão — o sedentário falha na flexão no
 * chão e conclui que é incapaz. Todo padrão de movimento tem uma escada
 * completa, da regressão mais acessível à progressão mais difícil.
 *
 * `minRank` marca o rank em que aquele degrau vira o degrau padrão do plano.
 * `illustrations: null` num padrão de carga deixa o exercício BLOQUEADO
 * (R11.4): cue de texto não ensina forma para quem nunca treinou.
 */
const ill = (slug: string) => ({ start: `illus/${slug}_start`, end: `illus/${slug}_end` });

interface Spec {
  id: string;
  pt: string;
  en: string;
  sys: string;
  pattern: Pattern;
  d: number;
  rank: Rank;
  unit?: Exercise['unit'];
  eq?: Exercise['equipment'];
  contra?: Exercise['contraindications'];
  reg?: string | null;
  prog?: string | null;
  cues: [string, string, string];
  errs: string[];
  crit: string;
  attr?: Exercise['attribute'];
  noIll?: boolean;
}

function build(s: Spec): Exercise {
  return {
    id: s.id,
    namePt: s.pt,
    nameEn: s.en,
    systemNamePt: s.sys,
    pattern: s.pattern,
    difficulty: s.d,
    minRank: s.rank,
    unit: s.unit ?? 'reps',
    equipment: s.eq ?? ['none'],
    contraindications: s.contra ?? [],
    regressionId: s.reg ?? null,
    progressionId: s.prog ?? null,
    cues: s.cues,
    commonErrors: s.errs,
    illustrations: s.noIll ? null : ill(s.id),
    progressionCriteria: s.crit,
    attribute: s.attr ?? 'STR',
  };
}

const SPECS: Spec[] = [
  // ══ EMPURRAR HORIZONTAL (9) ═══════════════════════════════════════════════
  { id: 'push_wall', pt: 'Flexão na parede', en: 'Wall push-up', sys: 'Golpe Básico I',
    pattern: 'push_h', d: 1, rank: 'E', contra: ['wrist'], prog: 'push_bench',
    cues: ['Corpo em linha reta da cabeça ao calcanhar', 'Cotovelos a 45° do tronco, não abertos a 90°', 'Desce em 2 segundos, sobe em 1'],
    errs: ['Quadril caindo ou empinado', 'Amplitude parcial — o peito precisa chegar perto da parede'],
    crit: '2 séries de 15 com boa forma, em 2 sessões seguidas' },
  { id: 'push_bench', pt: 'Flexão na bancada', en: 'Counter push-up', sys: 'Golpe Básico II',
    pattern: 'push_h', d: 2, rank: 'E', contra: ['wrist'], reg: 'push_wall', prog: 'push_sofa',
    cues: ['Mãos na largura dos ombros', 'Escápulas retraídas antes de descer', 'Quadril acompanha o tronco, não atrasa'],
    errs: ['Apoio que balança ou afunda', 'Cabeça projetada à frente'],
    crit: '2 séries de 12 com boa forma' },
  { id: 'push_sofa', pt: 'Flexão no sofá', en: 'Sofa push-up', sys: 'Golpe Básico III',
    pattern: 'push_h', d: 3, rank: 'E', contra: ['wrist'], reg: 'push_bench', prog: 'push_step',
    cues: ['Apoio firme, sem almofada solta', 'Peito toca a borda', 'Empurra o apoio para longe'],
    errs: ['Escolher apoio que afunda', 'Descer só metade da amplitude'],
    crit: '2 séries de 12' },
  { id: 'push_step', pt: 'Flexão no degrau', en: 'Low-step push-up', sys: 'Golpe Firme',
    pattern: 'push_h', d: 4, rank: 'D', contra: ['wrist'], reg: 'push_sofa', prog: 'push_knee',
    cues: ['Quanto mais baixo o apoio, mais difícil', 'Linha reta do calcanhar à nuca', 'Cotovelos para trás'],
    errs: ['Quadril subindo com o cansaço', 'Pescoço projetado'],
    crit: '3 séries de 10' },
  { id: 'push_knee', pt: 'Flexão de joelhos', en: 'Knee push-up', sys: 'Golpe Apoiado',
    pattern: 'push_h', d: 5, rank: 'D', contra: ['wrist', 'knee'], reg: 'push_step', prog: 'push_negative',
    cues: ['Linha reta do joelho à cabeça', 'Peito toca antes do quadril', 'Cotovelos para trás, não para os lados'],
    errs: ['Sentar nos calcanhares', 'Descer só metade da amplitude'],
    crit: '2 séries de 15 com boa forma' },
  { id: 'push_negative', pt: 'Negativa lenta', en: 'Negative push-up', sys: 'Golpe Contido',
    pattern: 'push_h', d: 6, rank: 'D', contra: ['wrist'], reg: 'push_knee', prog: 'push_full',
    cues: ['4 segundos para descer', 'Volta apoiando os joelhos', 'Core firme o tempo todo'],
    errs: ['Descer rápido demais', 'Perder a linha do quadril no fim'],
    crit: '3 séries de 5 negativas controladas' },
  { id: 'push_full', pt: 'Flexão completa', en: 'Full push-up', sys: 'Golpe Pleno',
    pattern: 'push_h', d: 7, rank: 'C', contra: ['wrist'], reg: 'push_negative', prog: 'push_feet_elevated',
    cues: ['Corpo rígido como uma prancha', 'Peito a um punho do chão', 'Empurra o chão para longe'],
    errs: ['Quadril caindo e perdendo a linha', 'Pescoço projetado', 'Cotovelos abrindo a 90°'],
    crit: '3 séries de 12' },
  { id: 'push_feet_elevated', pt: 'Flexão com pés elevados', en: 'Feet-elevated push-up', sys: 'Golpe Ascendente',
    pattern: 'push_h', d: 8, rank: 'B', contra: ['wrist', 'shoulder'], reg: 'push_full', prog: 'push_diamond',
    cues: ['Pés numa superfície estável', 'Mesma linha de corpo da flexão comum', 'Controle na descida'],
    errs: ['Elevar demais e virar exercício de ombro', 'Perder a linha lombar'],
    crit: '3 séries de 10' },
  { id: 'push_diamond', pt: 'Flexão diamante', en: 'Diamond push-up', sys: 'Golpe Concentrado',
    pattern: 'push_h', d: 9, rank: 'A', contra: ['wrist', 'shoulder'], reg: 'push_feet_elevated',
    cues: ['Mãos formando losango sob o peito', 'Cotovelos raspando o tronco', 'Amplitude completa'],
    errs: ['Abrir os cotovelos e perder o estímulo', 'Apoiar no pescoço em vez do peito'],
    crit: '3 séries de 12' },

  // ══ EMPURRAR VERTICAL (5) ═════════════════════════════════════════════════
  { id: 'press_band', pt: 'Desenvolvimento com elástico', en: 'Band overhead press', sys: 'Ergue Menor',
    pattern: 'push_v', d: 2, rank: 'E', eq: ['band'], contra: ['shoulder'], prog: 'press_dumbbell',
    cues: ['Pisa no elástico na largura do quadril', 'Sobe sem arquear a lombar', 'Costelas para baixo'],
    errs: ['Arquear a lombar para compensar', 'Subir só até a testa'],
    crit: '3 séries de 15' },
  { id: 'press_dumbbell', pt: 'Desenvolvimento com halteres', en: 'Dumbbell press', sys: 'Ergue Maior',
    pattern: 'push_v', d: 4, rank: 'D', eq: ['dumbbell', 'gym'], contra: ['shoulder'], reg: 'press_band', prog: 'pike_push',
    cues: ['Punhos alinhados aos cotovelos', 'Glúteos contraídos para estabilizar', 'Desce até a altura da orelha'],
    errs: ['Lombar arqueando para compensar', 'Cotovelos muito à frente'],
    crit: '3 séries de 10' },
  { id: 'pike_push', pt: 'Flexão pike', en: 'Pike push-up', sys: 'Ergue Invertido',
    pattern: 'push_v', d: 6, rank: 'C', contra: ['shoulder', 'wrist'], reg: 'press_dumbbell', prog: 'pike_elevated',
    cues: ['Quadril alto, corpo em V invertido', 'Topo da cabeça em direção ao chão', 'Cotovelos para trás'],
    errs: ['Virar flexão comum por baixar o quadril', 'Apoiar a testa em vez de parar antes'],
    crit: '3 séries de 8' },
  { id: 'pike_elevated', pt: 'Pike com pés elevados', en: 'Elevated pike push-up', sys: 'Ergue Ascendente',
    pattern: 'push_v', d: 8, rank: 'B', contra: ['shoulder', 'wrist'], reg: 'pike_push', prog: 'handstand_wall',
    cues: ['Pés num apoio na altura do joelho', 'Tronco quase vertical', 'Desce controlado'],
    errs: ['Perder o equilíbrio por apoio instável', 'Amplitude curta demais'],
    crit: '3 séries de 8' },
  { id: 'handstand_wall', pt: 'Flexão parada de mão na parede', en: 'Wall handstand push-up', sys: 'Ergue Absoluto',
    pattern: 'push_v', d: 10, rank: 'S', contra: ['shoulder', 'wrist', 'neck'], reg: 'pike_elevated', noIll: true,
    cues: ['Barriga voltada para a parede', 'Corpo alinhado, sem arquear', 'Desce até a cabeça quase tocar'],
    errs: ['Arquear a lombar no topo', 'Tentar sem base de pike sólida'],
    crit: '3 séries de 5' },

  // ══ PUXAR HORIZONTAL (7) ══════════════════════════════════════════════════
  { id: 'row_band', pt: 'Remada com elástico', en: 'Band row', sys: 'Tração I',
    pattern: 'pull_h', d: 2, rank: 'E', eq: ['band'], contra: ['shoulder'], prog: 'row_band_single',
    cues: ['Puxa com o cotovelo, não com a mão', 'Escápulas se aproximam', 'Tronco parado, sem balanço'],
    errs: ['Encolher os ombros', 'Usar o tronco para puxar'],
    crit: '3 séries de 15 com elástico médio' },
  { id: 'row_band_single', pt: 'Remada unilateral com elástico', en: 'Single-arm band row', sys: 'Tração Partida',
    pattern: 'pull_h', d: 3, rank: 'E', eq: ['band'], contra: ['shoulder'], reg: 'row_band', prog: 'row_table',
    cues: ['Um braço de cada vez', 'Ombro oposto não gira', 'Pausa de 1s no fim do movimento'],
    errs: ['Rodar o tronco para ganhar amplitude', 'Soltar rápido na volta'],
    crit: '3 séries de 12 por braço' },
  { id: 'row_table', pt: 'Remada na mesa', en: 'Table row', sys: 'Tração II',
    pattern: 'pull_h', d: 4, rank: 'D', contra: ['shoulder'], reg: 'row_band_single', prog: 'row_dumbbell',
    cues: ['Corpo em linha reta, calcanhares no chão', 'Peito toca a borda da mesa', 'Desce em 3 segundos'],
    errs: ['Quadril caindo e perdendo a linha', 'Amplitude curta demais'],
    crit: '3 séries de 12' },
  { id: 'row_dumbbell', pt: 'Remada curvada com halteres', en: 'Dumbbell bent row', sys: 'Tração Pesada',
    pattern: 'pull_h', d: 5, rank: 'D', eq: ['dumbbell', 'gym'], contra: ['lower_back'], reg: 'row_table', prog: 'row_australian',
    cues: ['Quadril para trás, lombar neutra', 'Puxa em direção ao umbigo', 'Não gira o tronco'],
    errs: ['Arredondar a lombar', 'Puxar com o bíceps em vez das costas'],
    crit: '3 séries de 10' },
  { id: 'row_australian', pt: 'Remada australiana', en: 'Australian row', sys: 'Tração Plena',
    pattern: 'pull_h', d: 6, rank: 'C', eq: ['pullup_bar', 'gym'], contra: ['shoulder'], reg: 'row_dumbbell', prog: 'row_feet_elevated',
    cues: ['Barra na altura do quadril', 'Corpo rígido da cabeça ao calcanhar', 'Peito encosta na barra'],
    errs: ['Quadril cedendo', 'Puxar só com o braço'],
    crit: '3 séries de 10' },
  { id: 'row_feet_elevated', pt: 'Remada australiana com pés elevados', en: 'Feet-elevated row', sys: 'Tração Suspensa',
    pattern: 'pull_h', d: 8, rank: 'B', eq: ['pullup_bar', 'gym'], contra: ['shoulder'], reg: 'row_australian', prog: 'row_archer',
    cues: ['Pés num banco, corpo horizontal', 'Escápulas iniciam o movimento', 'Pausa no topo'],
    errs: ['Quadril cedendo', 'Balançar para ganhar impulso'],
    crit: '3 séries de 10' },
  { id: 'row_archer', pt: 'Remada arqueiro', en: 'Archer row', sys: 'Tração do Arqueiro',
    pattern: 'pull_h', d: 9, rank: 'A', eq: ['pullup_bar', 'gym'], contra: ['shoulder'], reg: 'row_feet_elevated', noIll: true,
    cues: ['Puxa em direção a um dos lados', 'Braço oposto quase estendido', 'Alterna a cada repetição'],
    errs: ['Girar o quadril', 'Encurtar a amplitude do lado fraco'],
    crit: '3 séries de 6 por lado' },

  // ══ PUXAR VERTICAL (5) ════════════════════════════════════════════════════
  { id: 'pulldown_band', pt: 'Puxada com elástico', en: 'Band pulldown', sys: 'Descida I',
    pattern: 'pull_v', d: 3, rank: 'E', eq: ['band'], contra: ['shoulder'], prog: 'bar_hang',
    cues: ['Elástico preso acima da cabeça', 'Puxa levando os cotovelos ao tronco', 'Peito aberto'],
    errs: ['Encolher os ombros', 'Puxar com os braços em vez das costas'],
    crit: '3 séries de 15' },
  { id: 'bar_hang', pt: 'Suspensão na barra', en: 'Dead hang', sys: 'Suspensão',
    pattern: 'pull_v', d: 4, rank: 'D', unit: 'seconds', eq: ['pullup_bar', 'gym'], contra: ['shoulder'], reg: 'pulldown_band', prog: 'pullup_band',
    cues: ['Pegada firme, ombros ativos', 'Não fica pendurado passivo', 'Respira normalmente'],
    errs: ['Ombros colados nas orelhas', 'Prender a respiração'],
    crit: '3 × 30 segundos' },
  { id: 'pullup_band', pt: 'Barra assistida com elástico', en: 'Band-assisted pull-up', sys: 'Ascensão Assistida',
    pattern: 'pull_v', d: 6, rank: 'C', eq: ['pullup_bar', 'band', 'gym'], contra: ['shoulder'], reg: 'bar_hang', prog: 'pullup_negative',
    cues: ['Elástico sob o joelho ou o pé', 'Queixo passa acima da barra', 'Desce em 3 segundos, sem soltar'],
    errs: ['Usar elástico forte demais e pular a fase difícil', 'Balançar o corpo para ganhar impulso'],
    crit: '3 séries de 8' },
  { id: 'pullup_negative', pt: 'Barra negativa', en: 'Negative pull-up', sys: 'Descida Contida',
    pattern: 'pull_v', d: 7, rank: 'B', eq: ['pullup_bar', 'gym'], contra: ['shoulder'], reg: 'pullup_band', prog: 'pullup_full',
    cues: ['Começa com o queixo acima da barra', '5 segundos para descer', 'Braços nunca travam de repente'],
    errs: ['Soltar em vez de descer', 'Descer em menos de 3 segundos'],
    crit: '3 séries de 5 negativas' },
  { id: 'pullup_full', pt: 'Barra fixa completa', en: 'Pull-up', sys: 'Ascensão',
    pattern: 'pull_v', d: 9, rank: 'A', eq: ['pullup_bar', 'gym'], contra: ['shoulder'], reg: 'pullup_negative',
    cues: ['Inicia puxando as escápulas para baixo', 'Queixo passa da barra', 'Desce até estender'],
    errs: ['Balançar o corpo (kipping) sem querer', 'Amplitude parcial'],
    crit: '3 séries de 8' },

  // ══ AGACHAR (9) ═══════════════════════════════════════════════════════════
  { id: 'squat_chair_assisted', pt: 'Sentar e levantar com apoio', en: 'Assisted sit-to-stand', sys: 'Postura de Base I',
    pattern: 'squat', d: 1, rank: 'E', prog: 'squat_chair',
    cues: ['Mãos apoiadas na mesa ou no braço da cadeira', 'Joelhos apontam na direção dos pés', 'Empurra o chão com o calcanhar'],
    errs: ['Puxar com os braços em vez de empurrar com as pernas', 'Sentar de queda'],
    crit: '2 séries de 12 sem puxar com os braços' },
  { id: 'squat_chair', pt: 'Sentar e levantar da cadeira', en: 'Sit-to-stand', sys: 'Postura de Base II',
    pattern: 'squat', d: 2, rank: 'E', reg: 'squat_chair_assisted', prog: 'squat_box',
    cues: ['Pés na largura do quadril', 'Peito aberto, olhar à frente', 'Levanta empurrando o chão com o calcanhar'],
    errs: ['Impulsionar com os braços', 'Joelho colapsando para dentro'],
    crit: '2 séries de 15 sem apoio das mãos' },
  { id: 'squat_box', pt: 'Agachamento tocando a cadeira', en: 'Chair tap squat', sys: 'Postura Marcada',
    pattern: 'squat', d: 3, rank: 'E', reg: 'squat_chair', prog: 'squat_wall_slide',
    cues: ['Toca o assento da cadeira sem sentar o peso', 'Quadril vai para trás primeiro', 'Sobe sem pausa longa'],
    errs: ['Desabar no assento', 'Calcanhar saindo do chão'],
    crit: '2 séries de 15' },
  { id: 'squat_wall_slide', pt: 'Agachamento deslizando na parede', en: 'Wall slide squat', sys: 'Postura Apoiada',
    pattern: 'squat', d: 4, rank: 'D', contra: ['knee'], reg: 'squat_box', prog: 'squat_partial',
    cues: ['Costas encostadas na parede, pés um passo à frente', 'Desce deslizando as costas na parede', 'Joelhos atrás da ponta dos pés'],
    errs: ['Pés muito próximos da parede', 'Descer além do confortável para o joelho'],
    crit: '3 séries de 12' },
  { id: 'squat_partial', pt: 'Agachamento livre parcial', en: 'Partial squat', sys: 'Postura Firme',
    pattern: 'squat', d: 5, rank: 'D', contra: ['knee'], reg: 'squat_wall_slide', prog: 'squat_full',
    cues: ['Desce até onde a lombar mantém a curva', 'Peso distribuído no pé inteiro', 'Sobe sem travar o joelho'],
    errs: ['Lombar arredondando no fundo', 'Joelho para dentro'],
    crit: '3 séries de 15' },
  { id: 'squat_full', pt: 'Agachamento livre completo', en: 'Bodyweight squat', sys: 'Postura do Caçador',
    pattern: 'squat', d: 6, rank: 'C', contra: ['knee'], reg: 'squat_partial', prog: 'squat_tempo',
    cues: ['Coxa paralela ao chão', 'Joelhos acompanham a ponta dos pés', 'Tronco e canela em ângulos parecidos'],
    errs: ['Calcanhar levantando', 'Quicar no fundo', 'Joelho colapsando'],
    crit: '3 séries de 20' },
  { id: 'squat_tempo', pt: 'Agachamento com tempo', en: 'Tempo squat', sys: 'Postura Contida',
    pattern: 'squat', d: 7, rank: 'B', contra: ['knee'], reg: 'squat_full', prog: 'squat_goblet',
    cues: ['3 segundos descendo, sem acelerar', '1 segundo de pausa parado no fundo', 'Sobe com força, sem quicar'],
    errs: ['Acelerar a descida com o cansaço', 'Perder a pausa'],
    crit: '3 séries de 12' },
  { id: 'squat_goblet', pt: 'Agachamento goblet', en: 'Goblet squat', sys: 'Postura Carregada',
    pattern: 'squat', d: 8, rank: 'B', eq: ['dumbbell', 'gym'], contra: ['knee'], reg: 'squat_tempo', prog: 'squat_jump',
    cues: ['Peso junto ao peito, cotovelos para dentro', 'Peito aberto', 'Desce entre os joelhos'],
    errs: ['Tronco caindo à frente', 'Peso longe do corpo'],
    crit: '3 séries de 12' },
  { id: 'squat_jump', pt: 'Agachamento com salto', en: 'Jump squat', sys: 'Postura Explosiva',
    pattern: 'squat', d: 9, rank: 'A', contra: ['knee'], reg: 'squat_goblet',
    cues: ['Aterrissa suave, absorvendo com o joelho', 'Joelhos alinhados na aterrissagem', 'Qualidade antes de quantidade'],
    errs: ['Aterrissar com a perna travada', 'Joelho para dentro na aterrissagem'],
    crit: '3 séries de 10 com aterrissagem silenciosa' },

  // ══ DOBRADIÇA DE QUADRIL (7) ══════════════════════════════════════════════
  { id: 'glute_bridge', pt: 'Ponte de glúteo', en: 'Glute bridge', sys: 'Alicerce I',
    pattern: 'hinge', d: 1, rank: 'E', prog: 'hip_hinge',
    cues: ['Pés na largura do quadril, calcanhar perto do glúteo', 'Sobe apertando o glúteo, não a lombar', 'Costelas para baixo no topo'],
    errs: ['Empurrar com a lombar em vez do glúteo', 'Subir demais e arquear'],
    crit: '3 séries de 15 com pausa de 2s no topo' },
  { id: 'hip_hinge', pt: 'Dobradiça de quadril', en: 'Hip hinge', sys: 'Alicerce II',
    pattern: 'hinge', d: 2, rank: 'E', contra: ['lower_back'], reg: 'glute_bridge', prog: 'good_morning',
    cues: ['Mãos na dobra do quadril, coluna longa', 'Quadril vai para trás, não desce', 'Costas retas do pescoço ao cóccix'],
    errs: ['Arredondar as costas', 'Agachar em vez de dobrar'],
    crit: '3 séries de 12 com as costas retas' },
  { id: 'good_morning', pt: 'Bom dia', en: 'Good morning', sys: 'Reverência',
    pattern: 'hinge', d: 4, rank: 'D', contra: ['lower_back'], reg: 'hip_hinge', prog: 'glute_bridge_single',
    cues: ['Joelhos levemente flexionados', 'Desce até sentir o posterior alongar', 'Lombar neutra o tempo todo'],
    errs: ['Descer além da amplitude com lombar neutra', 'Travar o joelho'],
    crit: '3 séries de 12' },
  { id: 'glute_bridge_single', pt: 'Ponte unilateral', en: 'Single-leg bridge', sys: 'Alicerce Partido',
    pattern: 'hinge', d: 5, rank: 'D', reg: 'good_morning', prog: 'rdl_dumbbell',
    cues: ['Uma perna estendida ou joelho ao peito', 'Quadril não gira', 'Glúteo do lado apoiado faz o trabalho'],
    errs: ['Quadril caindo para o lado livre', 'Empurrar com a lombar'],
    crit: '3 séries de 10 por perna' },
  { id: 'rdl_dumbbell', pt: 'Levantamento terra romeno', en: 'Romanian deadlift', sys: 'Ergue Terrestre',
    pattern: 'hinge', d: 6, rank: 'C', eq: ['dumbbell', 'gym'], contra: ['lower_back'], reg: 'glute_bridge_single', prog: 'hip_thrust',
    cues: ['Peso desliza rente à perna', 'Quadril para trás, peito para baixo', 'Sobe apertando o glúteo'],
    errs: ['Afastar o peso do corpo', 'Arredondar a lombar no fundo'],
    crit: '3 séries de 10' },
  { id: 'hip_thrust', pt: 'Elevação de quadril', en: 'Hip thrust', sys: 'Impulso',
    pattern: 'hinge', d: 7, rank: 'B', eq: ['dumbbell', 'gym'], reg: 'rdl_dumbbell', prog: 'rdl_single',
    cues: ['Escápulas apoiadas no banco', 'Queixo no peito durante todo o movimento', 'Pausa de 1s no topo'],
    errs: ['Hiperextender a lombar no topo', 'Apoiar o pescoço em vez das escápulas'],
    crit: '3 séries de 12' },
  { id: 'rdl_single', pt: 'Terra romeno unilateral', en: 'Single-leg RDL', sys: 'Ergue Equilibrado',
    pattern: 'hinge', d: 8, rank: 'A', eq: ['dumbbell', 'none'], contra: ['lower_back'], reg: 'hip_thrust', noIll: true,
    cues: ['Perna livre estendida atrás, formando linha com o tronco', 'Quadril nivelado', 'Desce devagar'],
    errs: ['Abrir o quadril para o lado', 'Perder o equilíbrio e compensar com a lombar'],
    crit: '3 séries de 8 por perna' },

  // ══ UNILATERAL DE PERNA (6) ═══════════════════════════════════════════════
  { id: 'step_up_low', pt: 'Subida em degrau baixo', en: 'Low step-up', sys: 'Passada I',
    pattern: 'unilateral', d: 2, rank: 'E', prog: 'lunge_static',
    cues: ['Degrau na altura da canela', 'Empurra com o pé de cima, não com o de baixo', 'Desce controlado'],
    errs: ['Impulsionar com o pé do chão', 'Descer de queda'],
    crit: '3 séries de 12 por perna' },
  { id: 'lunge_static', pt: 'Afundo estático', en: 'Static lunge', sys: 'Passada Firme',
    pattern: 'unilateral', d: 3, rank: 'D', contra: ['knee'], reg: 'step_up_low', prog: 'lunge_walking',
    cues: ['Passada longa o suficiente para o joelho da frente não passar do pé', 'Tronco ereto', 'Desce reto, não para frente'],
    errs: ['Passada curta demais', 'Joelho de trás batendo no chão'],
    crit: '3 séries de 10 por perna' },
  { id: 'lunge_walking', pt: 'Passada caminhando', en: 'Walking lunge', sys: 'Passada Contínua',
    pattern: 'unilateral', d: 5, rank: 'C', contra: ['knee'], reg: 'lunge_static', prog: 'step_up_high',
    cues: ['Passo largo, desce na vertical', 'Olhar à frente', 'Transição sem pausa longa'],
    errs: ['Passos curtos', 'Tronco caindo à frente'],
    crit: '3 séries de 12 passos por perna' },
  { id: 'step_up_high', pt: 'Subida em degrau alto', en: 'High step-up', sys: 'Passada Alta',
    pattern: 'unilateral', d: 6, rank: 'C', contra: ['knee'], reg: 'lunge_walking', prog: 'squat_bulgarian',
    cues: ['Degrau na altura do joelho', 'Todo o pé apoiado em cima', 'Sem impulso da perna de baixo'],
    errs: ['Impulsionar com o pé do chão', 'Apoiar só a ponta do pé'],
    crit: '3 séries de 10 por perna' },
  { id: 'squat_bulgarian', pt: 'Agachamento búlgaro', en: 'Bulgarian split squat', sys: 'Postura Partida',
    pattern: 'unilateral', d: 7, rank: 'B', contra: ['knee'], reg: 'step_up_high', prog: 'pistol_assisted',
    cues: ['Pé de trás apoiado numa cadeira ou no sofá', 'Peso no pé da frente', 'Desce reto, não para frente'],
    errs: ['Passada curta demais', 'Tronco caindo à frente'],
    crit: '3 séries de 10 por perna' },
  { id: 'pistol_assisted', pt: 'Pistol assistido', en: 'Assisted pistol squat', sys: 'Postura Solitária',
    pattern: 'unilateral', d: 9, rank: 'A', contra: ['knee'], reg: 'squat_bulgarian', noIll: true,
    cues: ['Segura num apoio só para equilíbrio, não para puxar', 'Perna livre estendida à frente', 'Calcanhar no chão'],
    errs: ['Usar o apoio como alavanca', 'Desabar no fundo'],
    crit: '3 séries de 5 por perna' },

  // ══ CORE ANTI-EXTENSÃO (6) ════════════════════════════════════════════════
  { id: 'plank_wall', pt: 'Prancha na parede', en: 'Wall plank', sys: 'Guarda Inicial',
    pattern: 'core_anti_ext', d: 1, rank: 'E', unit: 'seconds', attr: 'PER', prog: 'plank_knee',
    cues: ['Antebraços na parede, corpo inclinado', 'Umbigo para dentro', 'Respira sem soltar o core'],
    errs: ['Lombar cedendo', 'Prender a respiração'],
    crit: '2 × 45 segundos' },
  { id: 'plank_knee', pt: 'Prancha de joelhos', en: 'Knee plank', sys: 'Guarda de Ferro I',
    pattern: 'core_anti_ext', d: 2, rank: 'E', unit: 'seconds', attr: 'PER', contra: ['lower_back'], reg: 'plank_wall', prog: 'dead_bug',
    cues: ['Cotovelos alinhados sob os ombros', 'Umbigo puxado para dentro', 'Glúteos contraídos o tempo todo'],
    errs: ['Quadril alto demais', 'Lombar cedendo'],
    crit: '2 × 30 segundos com lombar neutra' },
  { id: 'dead_bug', pt: 'Dead bug', en: 'Dead bug', sys: 'Guarda Invertida',
    pattern: 'core_anti_ext', d: 3, rank: 'D', attr: 'PER', reg: 'plank_knee', prog: 'plank_full',
    cues: ['Lombar colada no chão', 'Move braço e perna opostos', 'Devagar, sem perder o contato lombar'],
    errs: ['Lombar arqueando para compensar', 'Movimento rápido demais'],
    crit: '3 × 10 por lado' },
  { id: 'plank_full', pt: 'Prancha completa', en: 'Full plank', sys: 'Guarda de Ferro II',
    pattern: 'core_anti_ext', d: 5, rank: 'C', unit: 'seconds', attr: 'PER', contra: ['lower_back', 'shoulder'], reg: 'dead_bug', prog: 'plank_reach',
    cues: ['Linha reta da cabeça ao calcanhar', 'Respira sem soltar o core', 'Ombros longe das orelhas'],
    errs: ['Prender a respiração', 'Quadril subindo com o cansaço'],
    crit: '3 × 45 segundos' },
  { id: 'plank_reach', pt: 'Prancha com alcance', en: 'Plank reach', sys: 'Guarda Estendida',
    pattern: 'core_anti_ext', d: 7, rank: 'B', attr: 'PER', contra: ['lower_back', 'shoulder'], reg: 'plank_full', prog: 'ab_wheel',
    cues: ['Estende um braço à frente sem girar o quadril', 'Pés um pouco mais afastados dá estabilidade', 'Alterna devagar'],
    errs: ['Quadril girando', 'Alternar rápido demais'],
    crit: '3 × 10 alcances por lado' },
  { id: 'ab_wheel', pt: 'Roda abdominal', en: 'Ab wheel rollout', sys: 'Guarda Absoluta',
    pattern: 'core_anti_ext', d: 9, rank: 'A', attr: 'PER', eq: ['gym'], contra: ['lower_back', 'shoulder'], reg: 'plank_reach', noIll: true,
    cues: ['Começa de joelhos', 'Vai só até onde a lombar não arqueia', 'Volta puxando com o core'],
    errs: ['Ir longe demais e arquear', 'Puxar com o braço'],
    crit: '3 séries de 8 com amplitude completa' },

  // ══ CORE ANTI-ROTAÇÃO (4) ═════════════════════════════════════════════════
  { id: 'pallof_band', pt: 'Pallof press', en: 'Pallof press', sys: 'Guarda Lateral I',
    pattern: 'core_anti_rot', d: 3, rank: 'E', attr: 'PER', eq: ['band'], prog: 'side_plank_knee',
    cues: ['Elástico preso na lateral, na altura do peito', 'Estende os braços resistindo à rotação', 'Quadril fixo'],
    errs: ['Deixar o tronco girar', 'Segurar a respiração'],
    crit: '3 × 12 por lado' },
  { id: 'side_plank_knee', pt: 'Prancha lateral de joelhos', en: 'Knee side plank', sys: 'Guarda Lateral II',
    pattern: 'core_anti_rot', d: 4, rank: 'D', unit: 'seconds', attr: 'PER', contra: ['shoulder'], reg: 'pallof_band', prog: 'side_plank',
    cues: ['Cotovelo alinhado sob o ombro', 'Joelhos flexionados atrás do corpo', 'Quadril alto, sem afundar'],
    errs: ['Quadril caindo e perdendo a linha', 'Rodar o tronco para frente'],
    crit: '3 × 30 segundos por lado' },
  { id: 'side_plank', pt: 'Prancha lateral', en: 'Side plank', sys: 'Guarda Lateral Plena',
    pattern: 'core_anti_rot', d: 6, rank: 'C', unit: 'seconds', attr: 'PER', contra: ['shoulder'], reg: 'side_plank_knee', prog: 'suitcase_hold',
    cues: ['Cotovelo alinhado sob o ombro', 'Quadril alto, sem afundar', 'Corpo todo num plano só'],
    errs: ['Quadril caindo e perdendo a linha', 'Rotação do tronco'],
    crit: '3 × 30 segundos por lado' },
  { id: 'suitcase_hold', pt: 'Sustentação unilateral', en: 'Suitcase hold', sys: 'Guarda Carregada',
    pattern: 'core_anti_rot', d: 7, rank: 'B', unit: 'seconds', attr: 'PER', eq: ['dumbbell', 'gym'], reg: 'side_plank', noIll: true,
    cues: ['Peso em uma mão só, braço estendido', 'Ombros nivelados', 'Não deixa o tronco inclinar'],
    errs: ['Inclinar para o lado do peso', 'Encolher o ombro'],
    crit: '3 × 40 segundos por lado' },

  // ══ FLEXÃO DE TRONCO (4) ══════════════════════════════════════════════════
  { id: 'crunch_short', pt: 'Abdominal curto', en: 'Crunch', sys: 'Dobra I',
    pattern: 'trunk_flex', d: 2, rank: 'E', contra: ['neck'], prog: 'leg_raise_bent',
    cues: ['Queixo a um punho do peito', 'Sobe só até a escápula sair do chão', 'Mãos não puxam a cabeça'],
    errs: ['Puxar o pescoço com as mãos', 'Subir o tronco inteiro'],
    crit: '3 séries de 20' },
  { id: 'leg_raise_bent', pt: 'Elevação de pernas flexionadas', en: 'Bent knee raise', sys: 'Dobra II',
    pattern: 'trunk_flex', d: 4, rank: 'D', contra: ['lower_back'], reg: 'crunch_short', prog: 'situp_full',
    cues: ['Lombar colada no chão', 'Joelhos a 90°', 'Desce só até a lombar querer descolar'],
    errs: ['Lombar arqueando na descida', 'Usar impulso'],
    crit: '3 séries de 15' },
  { id: 'situp_full', pt: 'Abdominal completo', en: 'Full sit-up', sys: 'Dobra Plena',
    pattern: 'trunk_flex', d: 6, rank: 'C', contra: ['lower_back', 'neck'], reg: 'leg_raise_bent', prog: 'leg_raise_straight',
    cues: ['Sobe desenrolando a coluna, vértebra por vértebra', 'Pés apoiados ou ancorados', 'Desce com o mesmo controle'],
    errs: ['Subir de impulso', 'Puxar o pescoço'],
    crit: '3 séries de 25' },
  { id: 'leg_raise_straight', pt: 'Elevação de pernas estendidas', en: 'Straight leg raise', sys: 'Dobra Absoluta',
    pattern: 'trunk_flex', d: 8, rank: 'B', contra: ['lower_back'], reg: 'situp_full',
    cues: ['Pernas retas, lombar colada', 'Desce em 3 segundos', 'Para antes de a lombar descolar'],
    errs: ['Lombar arqueando para compensar', 'Balançar as pernas'],
    crit: '3 séries de 12' },

  // ══ CARREGAMENTO (3) ══════════════════════════════════════════════════════
  { id: 'farmer_walk', pt: 'Caminhada do fazendeiro', en: 'Farmer walk', sys: 'Marcha Carregada',
    pattern: 'carry', d: 4, rank: 'D', unit: 'meters', eq: ['dumbbell', 'gym'], prog: 'suitcase_walk',
    cues: ['Peso igual nas duas mãos', 'Ombros para trás e para baixo', 'Passos curtos e firmes'],
    errs: ['Encolher os ombros', 'Inclinar o tronco à frente'],
    crit: '3 × 40 metros' },
  { id: 'suitcase_walk', pt: 'Caminhada unilateral', en: 'Suitcase carry', sys: 'Marcha Desequilibrada',
    pattern: 'carry', d: 6, rank: 'C', unit: 'meters', eq: ['dumbbell', 'gym'], reg: 'farmer_walk', prog: 'overhead_carry',
    cues: ['Peso em uma mão só, braço colado', 'Tronco não inclina para o lado', 'Ombros nivelados'],
    errs: ['Inclinar para o lado do peso', 'Passos largos que desestabilizam'],
    crit: '3 × 30 metros por lado' },
  { id: 'overhead_carry', pt: 'Caminhada com peso acima da cabeça', en: 'Overhead carry', sys: 'Marcha Erguida',
    pattern: 'carry', d: 8, rank: 'B', unit: 'meters', eq: ['dumbbell', 'gym'], contra: ['shoulder'], reg: 'suitcase_walk', noIll: true,
    cues: ['Braço estendido, punho sobre o ombro', 'Costelas para baixo', 'Olhar à frente'],
    errs: ['Arquear a lombar no topo', 'Braço à frente em vez de alinhado'],
    crit: '3 × 25 metros por lado' },

  // ══ AERÓBICO (8) ══════════════════════════════════════════════════════════
  { id: 'march_in_place', pt: 'Marcha no lugar', en: 'March in place', sys: 'Marcha Parada',
    pattern: 'aerobic', d: 1, rank: 'E', unit: 'minutes', attr: 'AGI', noIll: true, prog: 'walk',
    cues: ['Joelho na altura do quadril', 'Braços acompanham', 'Ritmo que dá para conversar'],
    errs: ['Arrastar os pés', 'Começar rápido demais'],
    crit: '10 minutos contínuos' },
  { id: 'walk', pt: 'Caminhada', en: 'Walk', sys: 'Marcha', pattern: 'aerobic',
    d: 2, rank: 'E', unit: 'minutes', attr: 'AGI', noIll: true, reg: 'march_in_place', prog: 'stairs',
    cues: ['Ritmo em que dá para falar frases curtas', 'Passada natural', 'Ombros relaxados'],
    errs: ['Começar rápido demais e parar cedo'],
    crit: '20 minutos contínuos sem pausa' },
  { id: 'stairs', pt: 'Subida de escada', en: 'Stair climbing', sys: 'Ascensão Vertical',
    pattern: 'aerobic', d: 4, rank: 'D', unit: 'minutes', attr: 'AGI', contra: ['knee'], noIll: true, reg: 'walk', prog: 'walk_brisk',
    cues: ['Pé inteiro no degrau', 'Apoia a mão no corrimão se precisar', 'Desce devagar — a descida castiga o joelho'],
    errs: ['Pisar só na ponta do pé', 'Descer correndo'],
    crit: '10 minutos contínuos' },
  { id: 'walk_brisk', pt: 'Caminhada rápida', en: 'Brisk walk', sys: 'Marcha Forçada',
    pattern: 'aerobic', d: 5, rank: 'D', unit: 'minutes', attr: 'AGI', noIll: true, reg: 'stairs', prog: 'jumping_jack',
    cues: ['Respiração audível mas controlada', 'Braços acompanham', 'Não consegue cantar, consegue conversar'],
    errs: ['Confundir rápido com corrida'],
    crit: '30 minutos contínuos' },
  { id: 'jumping_jack', pt: 'Polichinelo', en: 'Jumping jack', sys: 'Salto Aberto',
    pattern: 'aerobic', d: 6, rank: 'C', attr: 'AGI', contra: ['knee'], noIll: true, reg: 'walk_brisk', prog: 'run_walk',
    cues: ['Aterrissa com o joelho levemente flexionado', 'Ritmo constante', 'Braços sobem até a linha da orelha'],
    errs: ['Aterrissar com a perna travada', 'Acelerar até perder a forma'],
    crit: '3 séries de 40' },
  { id: 'run_walk', pt: 'Corrida intercalada', en: 'Run-walk', sys: 'Avanço',
    pattern: 'aerobic', d: 7, rank: 'C', unit: 'minutes', attr: 'AGI', contra: ['knee'], noIll: true, reg: 'jumping_jack', prog: 'run_continuous',
    cues: ['1 minuto correndo, 2 caminhando', 'Passada curta', 'Pisa sob o corpo, não à frente'],
    errs: ['Correr rápido demais nos intervalos'],
    crit: '5 km sem parar de se mover' },
  { id: 'run_continuous', pt: 'Corrida contínua', en: 'Continuous run', sys: 'Corrida',
    pattern: 'aerobic', d: 8, rank: 'B', unit: 'minutes', attr: 'AGI', contra: ['knee'], noIll: true, reg: 'run_walk', prog: 'run_long',
    cues: ['Cadência alta, passada curta', 'Ombros soltos', 'Ritmo em que dá para falar frases curtas'],
    errs: ['Passada longa demais', 'Aterrissar no calcanhar à frente do corpo'],
    crit: '5 km contínuos' },
  { id: 'run_long', pt: 'Corrida longa', en: 'Long run', sys: 'Travessia',
    pattern: 'aerobic', d: 10, rank: 'S', unit: 'minutes', attr: 'AGI', contra: ['knee'], noIll: true, reg: 'run_continuous',
    cues: ['Ritmo confortável, não é prova', 'Hidrata antes e durante', 'Aumenta a distância no máximo 10% por semana'],
    errs: ['Subir volume rápido demais', 'Ignorar dor articular por teimosia'],
    crit: '10 km contínuos' },

  // ══ MOBILIDADE (7) ════════════════════════════════════════════════════════
  { id: 'cat_camel', pt: 'Gato-camelo', en: 'Cat-camel', sys: 'Fluxo Vertebral',
    pattern: 'mobility', d: 1, rank: 'E', attr: 'PER', noIll: true,
    cues: ['Move vértebra por vértebra', 'Sem forçar o fim da amplitude', 'Acompanha a respiração'],
    errs: ['Movimento rápido', 'Forçar a lombar'],
    crit: 'Mobilidade, não progride por carga' },
  { id: 'chest_stretch', pt: 'Alongamento de peitoral', en: 'Doorway chest stretch', sys: 'Abertura',
    pattern: 'mobility', d: 1, rank: 'E', unit: 'seconds', attr: 'PER', noIll: true,
    cues: ['Antebraço no batente, cotovelo na altura do ombro', 'Gira o tronco devagar', 'Alonga, não dói'],
    errs: ['Forçar até doer', 'Encolher o ombro'],
    crit: 'Mobilidade, não progride por carga' },
  { id: 'hip_flexor_stretch', pt: 'Alongamento de flexor de quadril', en: 'Kneeling hip flexor stretch', sys: 'Soltura do Quadril',
    pattern: 'mobility', d: 2, rank: 'E', unit: 'seconds', attr: 'PER', contra: ['knee'], noIll: true,
    cues: ['Joelho de trás no chão, sobre uma almofada se incomodar', 'Aperta o glúteo do lado de trás', 'Empurra o quadril à frente sem arquear'],
    errs: ['Arquear a lombar em vez de mover o quadril', 'Joelho da frente passando do pé'],
    crit: 'Mobilidade, não progride por carga' },
  { id: 'ankle_rock', pt: 'Mobilidade de tornozelo', en: 'Ankle rock', sys: 'Base Livre',
    pattern: 'mobility', d: 2, rank: 'E', attr: 'PER', noIll: true,
    cues: ['Joelho passa por cima do dedo do pé', 'Calcanhar nunca sai do chão', 'Movimento lento'],
    errs: ['Levantar o calcanhar', 'Girar o pé para dentro'],
    crit: 'Mobilidade, não progride por carga' },
  { id: 'thoracic_rotation', pt: 'Rotação torácica 90/90', en: '90/90 thoracic rotation', sys: 'Giro Superior',
    pattern: 'mobility', d: 3, rank: 'D', attr: 'PER', noIll: true,
    cues: ['Deitado de lado, joelhos a 90°', 'Abre o braço de cima acompanhando com o olhar', 'Joelhos não saem do lugar'],
    errs: ['Deixar o joelho de cima subir', 'Forçar o ombro no chão'],
    crit: 'Mobilidade, não progride por carga' },
  { id: 'worlds_greatest', pt: 'Alongamento dinâmico completo', en: "World's greatest stretch", sys: 'Fluxo Total',
    pattern: 'mobility', d: 4, rank: 'D', attr: 'PER', contra: ['knee'], noIll: true,
    cues: ['Passada longa, mão no chão ao lado do pé', 'Cotovelo em direção ao tornozelo', 'Abre o braço para cima girando o tronco'],
    errs: ['Passada curta', 'Pular a rotação'],
    crit: 'Mobilidade, não progride por carga' },
  { id: 'shoulder_dislocate', pt: 'Passagem de ombro com elástico', en: 'Shoulder dislocate', sys: 'Soltura do Ombro',
    pattern: 'mobility', d: 4, rank: 'D', attr: 'PER', eq: ['band'], contra: ['shoulder'], noIll: true,
    cues: ['Pegada larga, braços estendidos', 'Leva de frente para trás devagar', 'Se doer, abre mais a pegada'],
    errs: ['Pegada estreita demais', 'Fazer rápido'],
    crit: 'Mobilidade, não progride por carga' },
];

export const EXERCISES: Exercise[] = SPECS.map(build);

export const exerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id);

export function exerciseName(e: Exercise, locale: 'pt-BR' | 'en-US'): string {
  return locale === 'en-US' ? e.nameEn : e.namePt;
}

export function systemName(e: Exercise, locale: 'pt-BR' | 'en-US'): string {
  return locale === 'en-US' ? (EXERCISES_EN[e.id]?.sys ?? e.systemNamePt) : e.systemNamePt;
}

export function exerciseCues(e: Exercise, locale: 'pt-BR' | 'en-US'): string[] {
  return locale === 'en-US' ? (EXERCISES_EN[e.id]?.cues ?? e.cues) : e.cues;
}

export function exerciseErrors(e: Exercise, locale: 'pt-BR' | 'en-US'): string[] {
  return locale === 'en-US' ? (EXERCISES_EN[e.id]?.errs ?? e.commonErrors) : e.commonErrors;
}

export function exerciseCriteria(e: Exercise, locale: 'pt-BR' | 'en-US'): string {
  return locale === 'en-US' ? (EXERCISES_EN[e.id]?.crit ?? e.progressionCriteria) : e.progressionCriteria;
}

export const exercisesByPattern = (pattern: Pattern): Exercise[] =>
  EXERCISES.filter((e) => e.pattern === pattern).sort((a, b) => a.difficulty - b.difficulty);

/** Escada completa de um padrão, da regressão mais simples à mais difícil. */
export function ladderFor(exerciseId: string): Exercise[] {
  const start = exerciseById(exerciseId);
  if (!start) return [];
  const chain: Exercise[] = [start];

  let cur = start;
  const seenBack = new Set([start.id]);
  while (cur.regressionId && !seenBack.has(cur.regressionId)) {
    const prev = exerciseById(cur.regressionId);
    if (!prev) break;
    seenBack.add(prev.id);
    chain.unshift(prev);
    cur = prev;
  }

  cur = start;
  const seenFwd = new Set([start.id]);
  while (cur.progressionId && !seenFwd.has(cur.progressionId)) {
    const next = exerciseById(cur.progressionId);
    if (!next) break;
    seenFwd.add(next.id);
    chain.push(next);
    cur = next;
  }
  return chain;
}
