import type { Shadow } from '../core/types';

/**
 * R10.2 — toda sombra dá um benefício funcional real. Nenhuma é só ícone.
 * R10.5 — nomes originais, nunca de personagem de obra protegida.
 */
export const SHADOWS: Shadow[] = [
  { id: 'sentinela', namePt: 'Sentinela', nameEn: 'Sentinel', grade: 'soldier', conditionPt: 'Primeira missão concluída', perkPt: 'Desbloqueia customização de notificação', unlockedAt: '2026-08-02' },
  { id: 'batedor', namePt: 'Batedor', nameEn: 'Scout', grade: 'soldier', conditionPt: '7 dias de sequência', perkPt: '+10% de XP por 7 dias', unlockedAt: '2026-08-09' },
  { id: 'sabujo', namePt: 'Sabujo', nameEn: 'Hound', grade: 'soldier', conditionPt: '10.000 passos em um dia', perkPt: 'Widget de passos na tela de Status', unlockedAt: '2026-08-14' },
  { id: 'arauto', namePt: 'Arauto', nameEn: 'Herald', grade: 'soldier', conditionPt: 'Ler 3 artigos do Códice', perkPt: 'Desbloqueia explicações avançadas', unlockedAt: '2026-08-18' },
  { id: 'guarda', namePt: 'Guarda', nameEn: 'Warden', grade: 'elite', conditionPt: '30 sessões concluídas', perkPt: 'Desbloqueia editor manual do plano', unlockedAt: '2026-09-01' },
  { id: 'vigia', namePt: 'Vigia', nameEn: 'Watcher', grade: 'elite', conditionPt: '4 semanas sem pular dia de treino', perkPt: '+1 Pedra de Recuperação por mês', unlockedAt: '2026-09-12' },
  { id: 'ferreiro', namePt: 'Ferreiro', nameEn: 'Smith', grade: 'elite', conditionPt: 'Progredir em 5 exercícios diferentes', perkPt: 'Mostra a escada completa no Códice', unlockedAt: '2026-09-15' },
  { id: 'carmesim', namePt: 'Espadachim Carmesim', nameEn: 'Crimson Blade', grade: 'knight', conditionPt: 'Primeira flexão completa no chão', perkPt: 'Desbloqueia o tema visual Chamas', unlockedAt: null },
  { id: 'berserker', namePt: 'Berserker', nameEn: 'Berserker', grade: 'knight', conditionPt: 'Completar um Portal Vermelho', perkPt: 'Desbloqueia a biblioteca de HIIT', unlockedAt: null },
  { id: 'andarilho', namePt: 'Andarilho', nameEn: 'Wanderer', grade: 'knight', conditionPt: '7.000 passos por 30 dias seguidos', perkPt: 'Meta de passos adaptativa', unlockedAt: null },
  { id: 'marechal', namePt: 'Marechal de Ferro', nameEn: 'Iron Marshal', grade: 'marshal', conditionPt: 'Alcançar o Rank B', perkPt: 'Desbloqueia periodização avançada', unlockedAt: null },
  { id: 'general', namePt: 'General', nameEn: 'General', grade: 'general', conditionPt: 'Alcançar o Rank S', perkPt: 'Título permanente e tema dourado', unlockedAt: null },
];

export const GRADE_LABEL: Record<Shadow['grade'], string> = {
  soldier: 'Soldado', elite: 'Elite', knight: 'Cavaleiro',
  commander: 'Comandante', marshal: 'Marechal', general: 'General',
};
