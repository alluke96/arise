import type { Shadow } from '../core/types';

/**
 * 40 sombras.
 *
 * R10.2 — cada uma dá um BENEFÍCIO FUNCIONAL real. Nenhuma é só ícone: se a
 * coleção virar enfeite, ela para de sustentar a retenção que justifica
 * existir. R10.5 — nomes originais, nunca de personagem de obra protegida.
 */
type Grade = Shadow['grade'];

interface S {
  id: string; pt: string; en: string; grade: Grade; cond: string; perk: string;
  unlockedAt?: string;
}

const SPECS: S[] = [
  // ── Soldado — primeiras semanas, o período de maior abandono ──────────────
  { id: 'sentinela', pt: 'Sentinela', en: 'Sentinel', grade: 'soldier',
    cond: 'Primeira missão concluída', perk: 'Desbloqueia customização de notificação', unlockedAt: '2026-08-02' },
  { id: 'batedor', pt: 'Batedor', en: 'Scout', grade: 'soldier',
    cond: '7 dias de sequência', perk: '+10% de XP por 7 dias', unlockedAt: '2026-08-09' },
  { id: 'sabujo', pt: 'Sabujo', en: 'Hound', grade: 'soldier',
    cond: '10.000 passos em um dia', perk: 'Widget de passos na tela de Status', unlockedAt: '2026-08-14' },
  { id: 'arauto', pt: 'Arauto', en: 'Herald', grade: 'soldier',
    cond: 'Ler 3 artigos do Códice', perk: 'Desbloqueia explicações avançadas', unlockedAt: '2026-08-18' },
  { id: 'lanceiro', pt: 'Lanceiro', en: 'Lancer', grade: 'soldier',
    cond: 'Concluir 10 sessões', perk: 'Desbloqueia o histórico em gráfico' },
  { id: 'vigia_noturno', pt: 'Vigia Noturno', en: 'Night Watch', grade: 'soldier',
    cond: 'Treinar depois das 21h por 5 vezes', perk: 'Tema de contraste reduzido para treino noturno' },
  { id: 'madrugador', pt: 'Madrugador', en: 'Dawnbreaker', grade: 'soldier',
    cond: 'Treinar antes das 7h por 5 vezes', perk: 'Lembrete matinal com a missão já aberta' },
  { id: 'peregrino', pt: 'Peregrino', en: 'Pilgrim', grade: 'soldier',
    cond: 'Caminhar 50 km acumulados', perk: 'Mapa de rotas favoritas' },

  // ── Elite — o hábito começou a pegar ──────────────────────────────────────
  { id: 'guarda', pt: 'Guarda', en: 'Warden', grade: 'elite',
    cond: '30 sessões concluídas', perk: 'Desbloqueia editor manual do plano', unlockedAt: '2026-09-01' },
  { id: 'vigia', pt: 'Vigia', en: 'Watcher', grade: 'elite',
    cond: '4 semanas sem pular dia de treino', perk: '+1 Pedra de Recuperação por mês', unlockedAt: '2026-09-12' },
  { id: 'ferreiro', pt: 'Ferreiro', en: 'Smith', grade: 'elite',
    cond: 'Progredir em 5 exercícios diferentes', perk: 'Mostra a escada completa no Códice', unlockedAt: '2026-09-15' },
  { id: 'sobrevivente', pt: 'Sobrevivente', en: 'Survivor', grade: 'elite',
    cond: 'Concluir 3 Zonas de Penalidade', perk: 'Zona de Penalidade passa a oferecer escolha de exercício' },
  { id: 'retornado', pt: 'Retornado', en: 'Returned', grade: 'elite',
    cond: 'Voltar de um Dungeon Break e treinar 2 semanas seguidas', perk: 'Protocolo de reentrada mais suave na próxima vez' },
  { id: 'cartografo', pt: 'Cartógrafo', en: 'Cartographer', grade: 'elite',
    cond: 'Registrar peso e cintura por 4 semanas', perk: 'Gráfico de composição corporal' },
  { id: 'disciplinado', pt: 'Disciplinado', en: 'Disciplined', grade: 'elite',
    cond: 'Cumprir uma semana de deload sem pular', perk: 'Periodização visível no calendário' },
  { id: 'arqueiro', pt: 'Arqueiro', en: 'Archer', grade: 'elite',
    cond: 'Primeira remada australiana completa', perk: 'Desbloqueia variações de puxada' },

  // ── Cavaleiro — capacidade física real mudou ──────────────────────────────
  { id: 'carmesim', pt: 'Espadachim Carmesim', en: 'Crimson Blade', grade: 'knight',
    cond: 'Primeira flexão completa no chão', perk: 'Desbloqueia o tema visual Chamas' },
  { id: 'berserker', pt: 'Berserker', en: 'Berserker', grade: 'knight',
    cond: 'Completar um Portal Vermelho', perk: 'Desbloqueia a biblioteca de HIIT' },
  { id: 'andarilho', pt: 'Andarilho', en: 'Wanderer', grade: 'knight',
    cond: '7.000 passos por 30 dias seguidos', perk: 'Meta de passos adaptativa' },
  { id: 'escalador', pt: 'Escalador', en: 'Climber', grade: 'knight',
    cond: 'Primeira barra fixa completa', perk: 'Desbloqueia progressões de barra' },
  { id: 'corredor', pt: 'Corredor', en: 'Runner', grade: 'knight',
    cond: 'Primeiros 5 km contínuos', perk: 'Planos de corrida por ritmo' },
  { id: 'inabalavel', pt: 'Inabalável', en: 'Unshaken', grade: 'knight',
    cond: 'Sequência de 60 dias', perk: '+2 Pedras de Recuperação por mês' },
  { id: 'centurião', pt: 'Centurião', en: 'Centurion', grade: 'knight',
    cond: '100 sessões concluídas', perk: 'Título exibido no perfil' },
  { id: 'pedra_angular', pt: 'Pedra Angular', en: 'Keystone', grade: 'knight',
    cond: 'Prancha de 2 minutos', perk: 'Desbloqueia core avançado' },
  { id: 'pilar', pt: 'Pilar', en: 'Pillar', grade: 'knight',
    cond: '50 agachamentos livres seguidos', perk: 'Desbloqueia agachamento com carga' },
  { id: 'martelo', pt: 'Martelo', en: 'Hammer', grade: 'knight',
    cond: '30 flexões completas seguidas', perk: 'Desbloqueia variações de empurrar' },

  // ── Comandante — consistência de longo prazo ──────────────────────────────
  { id: 'estrategista', pt: 'Estrategista', en: 'Strategist', grade: 'commander',
    cond: 'Planejar 8 semanas seguidas', perk: 'Planejador de blocos de treino' },
  { id: 'veterano', pt: 'Veterano', en: 'Veteran', grade: 'commander',
    cond: '6 meses de uso contínuo', perk: 'Relatório anual de progresso' },
  { id: 'mentor', pt: 'Mentor', en: 'Mentor', grade: 'commander',
    cond: 'Convidar alguém que treine 4 semanas', perk: 'Criar guilda com até 15 membros' },
  { id: 'guardiao', pt: 'Guardião', en: 'Guardian', grade: 'commander',
    cond: 'Nenhuma lesão registrada em 6 meses', perk: 'Análise de carga e recuperação' },
  { id: 'incansavel', pt: 'Incansável', en: 'Tireless', grade: 'commander',
    cond: 'Sequência de 120 dias', perk: 'Pedra de Recuperação permanente por semana' },
  { id: 'colecionador', pt: 'Colecionador', en: 'Collector', grade: 'commander',
    cond: 'Dominar 40 exercícios diferentes', perk: 'Códice completo destravado' },

  // ── Marechal — território de poucos ───────────────────────────────────────
  { id: 'marechal', pt: 'Marechal de Ferro', en: 'Iron Marshal', grade: 'marshal',
    cond: 'Alcançar o Rank B', perk: 'Desbloqueia periodização avançada' },
  { id: 'senhor_da_guerra', pt: 'Senhor da Guerra', en: 'Warlord', grade: 'marshal',
    cond: 'Alcançar o Rank A', perk: 'Desbloqueia a Missão Canônica em blocos' },
  { id: 'imortal', pt: 'Imortal', en: 'Undying', grade: 'marshal',
    cond: 'Sequência de 365 dias', perk: 'Moldura de perfil permanente' },
  { id: 'arquiteto', pt: 'Arquiteto', en: 'Architect', grade: 'marshal',
    cond: 'Criar e seguir um plano próprio por 12 semanas', perk: 'Editor completo de programa' },

  // ── General — o fim da jornada ────────────────────────────────────────────
  { id: 'general', pt: 'General', en: 'General', grade: 'general',
    cond: 'Alcançar o Rank S', perk: 'Título permanente e tema dourado' },
  { id: 'monarca', pt: 'Monarca das Sombras', en: 'Shadow Monarch', grade: 'general',
    cond: 'Manter o Rank S por 12 semanas', perk: 'Hall dos Veteranos e cosmético exclusivo' },
  { id: 'preparacao', pt: 'A Preparação', en: 'The Preparation', grade: 'general',
    cond: '100 flexões, 100 abdominais, 100 agachamentos e 10 km em um dia', perk: 'A missão canônica, concluída' },
  { id: 'primeiro', pt: 'O Primeiro Passo', en: 'The First Step', grade: 'general',
    cond: 'Olhar para trás e ver o Rank E de onde você saiu', perk: 'Linha do tempo completa da sua jornada' },
];

export const SHADOWS: Shadow[] = SPECS.map((s) => ({
  id: s.id,
  namePt: s.pt,
  nameEn: s.en,
  grade: s.grade,
  conditionPt: s.cond,
  perkPt: s.perk,
  unlockedAt: s.unlockedAt ?? null,
}));

export const GRADE_LABEL: Record<Grade, string> = {
  soldier: 'Soldado', elite: 'Elite', knight: 'Cavaleiro',
  commander: 'Comandante', marshal: 'Marechal', general: 'General',
};

export const GRADE_ORDER: Grade[] = [
  'soldier', 'elite', 'knight', 'commander', 'marshal', 'general',
];

export const shadowById = (id: string): Shadow | undefined =>
  SHADOWS.find((s) => s.id === id);
