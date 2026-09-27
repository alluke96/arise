import type { Pattern, Rank } from '../core/types';

/**
 * Programas por rank (§10 do product brief).
 *
 * Cada rank é um bloco com frequência, duração, séries, faixa de RPE e
 * descanso próprios. A progressão entre blocos é conservadora de propósito:
 * a literatura é explícita em prescrição inicial conservadora para
 * destreinados, e o teto de +10%/semana do motor vale por cima disto.
 */
export interface Program {
  rank: Rank;
  namePt: string;
  weeksFrom: number;
  daysPerWeek: [number, number];
  sessionMinutes: [number, number];
  sets: number;
  /** Faixa alvo de RPE. Iniciantes recebem faixa ampla, nunca número exato. */
  rpe: [number, number];
  restSeconds: number;
  patterns: Pattern[];
  focusPt: string;
  aerobicPt: string;
  stepGoal: number;
}

export const PROGRAMS: Record<Rank, Program> = {
  E: {
    rank: 'E', namePt: 'Despertar', weeksFrom: 1,
    daysPerWeek: [3, 3], sessionMinutes: [10, 15], sets: 2, rpe: [4, 5], restSeconds: 90,
    patterns: ['push_h', 'squat', 'core_anti_ext', 'aerobic'],
    focusPt: 'Criar o hábito, não condicionar. A sessão é curta de propósito.',
    aerobicPt: '10 minutos de caminhada',
    stepGoal: 3000,
  },
  D: {
    rank: 'D', namePt: 'Caçador Licenciado', weeksFrom: 5,
    daysPerWeek: [3, 3], sessionMinutes: [20, 20], sets: 3, rpe: [5, 6], restSeconds: 90,
    patterns: ['push_h', 'squat', 'core_anti_ext', 'aerobic', 'pull_h', 'hinge'],
    focusPt: 'Full body A/B alternado. Entram puxar e dobradiça de quadril.',
    aerobicPt: '20 a 25 minutos contínuos',
    stepGoal: 5000,
  },
  C: {
    rank: 'C', namePt: 'Caçador de Campo', weeksFrom: 11,
    daysPerWeek: [3, 4], sessionMinutes: [25, 30], sets: 3, rpe: [6, 7], restSeconds: 120,
    patterns: ['push_h', 'push_v', 'pull_h', 'squat', 'hinge', 'core_anti_ext', 'aerobic'],
    focusPt: 'Divisão superior/inferior opcional. Entra o Couch-to-5K.',
    aerobicPt: 'Corrida intercalada, 3×/semana',
    stepGoal: 7000,
  },
  B: {
    rank: 'B', namePt: 'Caçador de Elite', weeksFrom: 19,
    daysPerWeek: [4, 4], sessionMinutes: [30, 40], sets: 4, rpe: [7, 8], restSeconds: 150,
    patterns: ['push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge', 'unilateral', 'core_anti_ext', 'core_anti_rot', 'aerobic'],
    focusPt: 'Upper/Lower com periodização ondulatória. Entram unilateral e carregamento.',
    aerobicPt: '5 km, de run-walk para contínuo',
    stepGoal: 7000,
  },
  A: {
    rank: 'A', namePt: 'Monarca em Ascensão', weeksFrom: 27,
    daysPerWeek: [4, 5], sessionMinutes: [40, 50], sets: 4, rpe: [7, 8], restSeconds: 180,
    patterns: ['push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge', 'unilateral', 'core_anti_ext', 'core_anti_rot', 'trunk_flex', 'carry', 'aerobic'],
    focusPt: 'Push/Pull/Legs em blocos de 4 semanas com deload. Construção direta para a missão canônica.',
    aerobicPt: 'Corrida progressiva até 8 km',
    stepGoal: 8000,
  },
  S: {
    rank: 'S', namePt: 'A Missão Diária', weeksFrom: 41,
    daysPerWeek: [5, 5], sessionMinutes: [45, 60], sets: 4, rpe: [7, 8], restSeconds: 180,
    patterns: ['push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge', 'unilateral', 'core_anti_ext', 'core_anti_rot', 'trunk_flex', 'carry', 'aerobic'],
    focusPt: '100/100/100 + 10 km. Distribuída em blocos ao longo do dia por padrão — sessão única só com aviso explícito.',
    aerobicPt: '10 km',
    stepGoal: 9000,
  },
};

/** §3.5 — meta de passos progressiva, +500 a 1.000 por semana sobre a base. */
export function stepGoalFor(rank: Rank, weeksIn: number): number {
  const target = PROGRAMS[rank].stepGoal;
  const ramped = 3000 + weeksIn * 750;
  return Math.min(target, Math.round(ramped / 250) * 250);
}
