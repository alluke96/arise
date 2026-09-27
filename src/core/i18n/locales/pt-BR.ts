/**
 * pt-BR — idioma de origem. Toda chave nasce aqui.
 *
 * O namespace `system` é a VOZ do produto e tem duas variantes por mensagem:
 * `cold` (padrão, impessoal, fiel ao tom do Sistema) e `companion` (Modo
 * Companheiro). Tradução automática destrói esse tom, então as duas variantes
 * são escritas à mão nos dois idiomas.
 */
export const ptBR = {
  app: {
    name: 'Arise',
    tagline: 'Erguei-vos',
  },

  common: {
    continue: 'Continuar',
    back: 'Voltar',
    cancel: 'Cancelar',
    accept: 'Aceitar',
    decline: 'Recusar',
    save: 'Salvar',
    close: 'Fechar',
    yes: 'SIM',
    no: 'NÃO',
    optional: 'opcional',
    required: 'Obrigatório',
    soon: 'Em breve',
    locked: 'Bloqueado',
    active: 'Ativo',
    done: 'Concluído',
    of: 'de',
    step: 'Passo {{current}} de {{total}}',
    minutes: 'min',
    seconds: 's',
    meters: 'm',
    reps: 'repetições',
    days: 'dias',
    weeks: 'semanas',
  },

  tabs: {
    status: 'Status',
    quest: 'Missão',
    codex: 'Códice',
    army: 'Exército',
  },

  onboarding: {
    signalDetected: 'Sinal detectado',
    analyzing: 'Analisando candidato…',
    manaCapacity: 'Capacidade de mana',
    notMeasurable: 'não mensurável',
    provisionalRank: 'Classificação provisória',
    weakestLine: 'Você é o caçador mais fraco da humanidade.',
    invitation: 'Ninguém mais recebeu este convite.',
    youArePlayer: 'você é o Jogador',
    onlyOneLevels: '— o único que sobe de nível.',
    medicalDisclaimer: 'Este app não substitui avaliação médica.\nA triagem de saúde é obrigatória antes do primeiro treino.',

    registryTitle: 'Registro na\nAssociação',
    registrySubtitle: 'O Sistema precisa destes dados para calibrar sua Missão Diária e estimar seu gasto energético.',
    age: 'Idade',
    gender: 'Gênero',
    genderMale: 'Masculino',
    genderFemale: 'Feminino',
    genderUnspecified: 'Prefiro não informar',
    genderUnspecifiedNote: 'O Sistema usa a média das constantes no cálculo de TMB.',
    weight: 'Peso',
    height: 'Altura',
    waist: 'Cintura',
    waistNote: 'Marcador de risco melhor que o IMC. Vira um gráfico de progresso.',
    dataStaysLocal: 'Ficam só no seu aparelho. Alimentam a fórmula de Mifflin-St Jeor e a carga inicial.',
    minimumAge: 'O app é liberado a partir dos 16 anos.',
    increaseAge: 'Aumentar idade',
    decreaseAge: 'Diminuir idade',

    screeningTitle: 'Triagem de Saúde',
    screeningSource: 'PAR-Q+ · versão brasileira validada',
    screeningIntro: 'Nenhum treino é liberado antes disso. Responda com honestidade — é o único jeito de o Sistema te proteger.',
    screeningWhere: 'Onde?',
    screeningMoreQuestions: '+ {{count}} perguntas',
    cautionMode: 'Modo Prudência',
    cautionExplain: 'O Sistema vai remover os exercícios contraindicados e ativar o {{mode}} até liberação médica.',
    blockedExplain: 'O Sistema bloqueou a prescrição de treino. Procure um médico antes de continuar — só conteúdo educativo e caminhada leve ficam disponíveis.',

    contractGenerated: 'Missão diária gerada',
    registeredHunter: 'Caçador registrado',
    todaysMission: 'Sua missão de hoje',
    finalGoal: 'Objetivo final — Rank S',
    estimatedTime: 'Tempo estimado até lá',
    acceptContract: 'Aceitar o contrato',
    contractNote: 'A missão cresce no máximo 10% por semana.\nO Sistema recalibra sozinho se ficar pesado.',
  },

  status: {
    association: 'Associação de Caçadores',
    reassess: 'Reavaliar',
    level: 'Nível {{level}}',
    streak: 'sequência',
    recoveryStones: 'pedras de recuperação',
    attributes: {
      STR: 'Força', AGI: 'Agilidade', VIT: 'Vitalidade',
      PER: 'Percepção', INT: 'Inteligência',
    },
    attributesShort: { STR: 'FOR', AGI: 'AGI', VIT: 'VIT', PER: 'PER', INT: 'INT' },
  },

  quest: {
    daily: 'Missão Diária',
    questLabel: 'Quest',
    canonicalName: 'A Preparação Para Se Tornar Poderoso',
    deadline: 'Prazo',
    continueQuest: 'Continuar missão',
    resume: 'Retomar',
    reward: 'Recompensa',
    rewardDetail: '{{points}} pontos de atributo, {{xp}} XP e uma caixa de loot.',
    restDay: 'Missão: Recuperação. Descanse.',
    deloadWeek: 'Semana de Recuperação de Mana',
    set: 'Série {{current}} de {{total}}',
    perceivedEffort: 'Esforço percebido',
    talkTest: 'consegue falar uma frase?',
    rpeLight: 'leve',
    rpeModerate: 'moderado',
    rpeHard: 'difícil',
    rpeMax: 'máximo',
    tooHard: 'Muito difícil',
    tooEasy: 'Muito fácil',
    noJudgement: 'Regride ou progride na hora. Sem julgamento.',
    finishSet: 'Concluir série',
    tapEachRep: 'Toque a cada repetição',
    recordRep: 'Registrar repetição',
    exitSet: 'Sair da série',
    illustrationPending: 'Ilustração: posição inicial → final',
    noIllustration: 'Sem ilustração',
  },

  levelUp: {
    questComplete: 'Missão concluída',
    title: 'LEVEL UP',
    rewards: 'Recompensas',
    attributePoints: 'Pontos de atributo',
    experience: 'Experiência',
    lootBox: 'Caixa de loot',
    newShadow: 'Nova sombra extraída',
    viewShadow: 'Ver sombra',
  },

  penalty: {
    missedQuest: 'Missão diária não concluída',
    title: 'ZONA DE\nPENALIDADE',
    intro: 'Você tem {{minutes}} minutos para sair daqui. Nada de intenso — mobilidade e caminhada no lugar.',
    timeRemaining: 'Tempo restante',
    survive: 'Sobreviver',
    useStone: 'Usar pedra de recuperação ({{count}})',
    reassurance: 'Isto não é castigo. Concluir restaura sua sequência de {{days}} dias e devolve metade do XP. Seu nível, rank e histórico nunca são apagados — em nenhuma hipótese.',
    dungeonBreak: 'DUNGEON BREAK',
    dungeonBreakBody: 'As feras escaparam. Seu condicionamento está regredindo.\n\nProtocolo de reentrada ativado: próximas 3 sessões com 50% do volume.',
    returnToField: 'Retornar ao campo',
  },

  codex: {
    title: 'Códice',
    subtitle: '{{count}} exercícios · escada de progressão completa',
    search: 'Buscar exercício',
    ladderOf: 'Escada da {{pattern}}',
    mastered: 'Dominado',
    current: 'Atual',
    blockedNoIllustration: 'Bloqueado — sem par de ilustrações',
    illustrationRule: 'Exercício de carga sem par de ilustrações fica bloqueado e não é prescrito. Cue de texto não ensina forma para quem nunca treinou.',
    adaptedForYou: 'Adaptado para você',
    adaptedBody: 'Você marcou {{limits}} na triagem. O Sistema removeu os exercícios contraindicados do Rank {{rank}}.',
    cues: 'Pontos de técnica',
    commonErrors: 'Erros comuns',
  },

  army: {
    title: 'Exército de Sombras',
    subtitle: '{{unlocked}} de {{total}} extraídas · cada uma dá um benefício real',
    activePerks: 'Benefícios ativos',
    next: 'Próxima',
    grades: {
      soldier: 'Soldado', elite: 'Elite', knight: 'Cavaleiro',
      commander: 'Comandante', marshal: 'Marechal', general: 'General',
    },
  },

  benchmark: {
    bossRaid: 'Raide de Boss · semana {{week}}',
    passed: 'Reavaliação aprovada',
    failed: 'Reavaliação reprovada',
    results: 'Resultados do teste',
    advanceTo: 'Avançar para o Rank {{rank}}',
    backToTraining: 'Voltar ao treino',
    projection: 'Projeção recalculada com seus dados reais, não com a curva genérica: Rank S em {{weeks}} semanas.',
    nextIn: 'Próxima reavaliação em {{weeks}} semanas',
  },

  settings: {
    title: 'Associação',
    profile: 'Perfil e biometria',
    language: 'Idioma',
    units: 'Unidades',
    unitsNote: 'Independente do idioma — um brasileiro pode preferir lb.',
    systemTone: 'Tom do Sistema',
    toneCold: 'Frio',
    toneCompanion: 'Modo Companheiro',
    toneNote: 'O Sistema fala como uma interface, ou como alguém do seu lado.',
    notifications: 'Notificações',
    health: 'Saúde e triagem',
    subscription: 'Assinatura',
    nutrition: 'Nutrição',
    nutritionSoon: 'O Sistema ainda está calibrando este módulo.',
    privacy: 'Privacidade e dados',
    exportData: 'Exportar meus dados',
    importData: 'Importar backup',
    exportNote: 'Exportação nunca é bloqueada, nem depois que a assinatura acaba.',
    deleteAccount: 'Apagar tudo',
  },

  billing: {
    trialTitle: 'Seu teste terminou',
    trialDaysLeft: '{{days}} dias de teste restantes',
    monthly: 'Mensal',
    annual: 'Anual',
    save: 'economize {{percent}}%',
    perMonth: '/mês',
    perYear: '/ano',
    renewsAutomatically: 'Renova automaticamente. Cancele quando quiser.',
    trialDisclosure: '{{days}} dias grátis, depois {{price}}{{period}}. Renovação automática até o cancelamento.',
    restore: 'Restaurar compras',
    dataNotice: 'Seus dados ficam no aparelho e são copiados para o iCloud/Google. Contas com sincronização chegam na v1.2.',
    stillAvailable: 'Continuam disponíveis: seu histórico, a exportação dos seus dados e esta tela.',
    offlineGrace: 'Sem conexão para validar a assinatura. Você tem {{hours}} horas antes do bloqueio.',
  },

  system: {
    questAvailable: {
      cold: '[Missão Diária disponível.]',
      companion: 'Sua missão de hoje está pronta. Bora?',
    },
    fourHoursLeft: {
      cold: '[AVISO: 4 horas restantes.]',
      companion: 'Faltam 4 horas. Ainda dá tempo tranquilo.',
    },
    oneHourLeft: {
      cold: '[ALERTA: A Zona de Penalidade será ativada em 1 hora.]',
      companion: 'Última hora. Se não der hoje, amanhã tem 4 minutos para recuperar.',
    },
    questCompleted: {
      cold: '[Missão concluída. +3 pontos de atributo.]',
      companion: 'Missão concluída. +3 pontos — bom trabalho.',
    },
    recalibrated: {
      cold: '[O Sistema recalibrou sua missão.]',
      companion: 'Ajustei a missão para baixo. Semana difícil acontece.',
    },
    deloadWeek: {
      cold: '[Semana de Recuperação de Mana. Volume reduzido em 40%.]',
      companion: 'Semana leve. Descansar faz parte do plano, não é folga.',
    },
    restDay: {
      cold: '[Missão: Recuperação. Descanse. O Sistema exige.]',
      companion: 'Hoje é descanso. Sério, não treina.',
    },
    penaltyOpened: {
      cold: '[Zona de Penalidade ativada. 4 minutos.]',
      companion: 'Perdeu ontem. São 4 minutos leves para recuperar a sequência.',
    },
    penaltyCleared: {
      cold: '[Zona de Penalidade concluída. Sequência restaurada.]',
      companion: 'Pronto, sequência de volta. Nada se perdeu.',
    },
    streakBroken: {
      cold: '[Sequência zerada. Nível, rank e histórico permanecem.]',
      companion: 'A sequência zerou, mas seu nível e seu rank continuam inteiros.',
    },
    rankUp: {
      cold: '[Reavaliação aprovada. Novo rank atribuído.]',
      companion: 'Você passou. Rank novo — isso é mudança física de verdade.',
    },
    rankDown: {
      cold: '[Descondicionamento detectado. Rank reavaliado para baixo.]',
      companion: 'Ficou um tempo parado e o corpo respondeu. É reversível, e mais rápido que da primeira vez.',
    },
    cautionMode: {
      cold: '[Modo Prudência ativo. Intensidade limitada a RPE 5.]',
      companion: 'Modo Prudência ligado. Vamos devagar até você ter liberação médica.',
    },
    shadowExtracted: {
      cold: '[ARISE]',
      companion: 'Nova sombra. Olha o que ela desbloqueou.',
    },
  },
} as const;

/**
 * Preserva a ESTRUTURA de pt-BR mas aceita qualquer string no valor.
 *
 * Sem isso, o `as const` fixaria cada valor como tipo literal e o en-US não
 * compilaria. Com isso, faltar uma chave em outro idioma vira erro de
 * compilação — não string crua aparecendo em produção (R14.5).
 */
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type Translations = DeepString<typeof ptBR>;
