import { create } from 'zustand';
import { STARTING_RANK, evaluateParq, type BaselineAnswers, type ParqKey } from '../../core/engine';
import { getDeviceId } from '../../core/ids';
import { repositories } from '../../core/repositories';
import type { Equipment, Limitation, UserProfile } from '../../core/types';
import { todayISO } from '../../data/mocks/demo';

/**
 * Rascunho do onboarding. Nada é gravado antes do Contrato: quem desiste no
 * meio não deixa um perfil pela metade no banco.
 */
interface OnboardingState {
  draft: UserProfile;
  parq: Partial<Record<ParqKey, boolean>>;
  baseline: BaselineAnswers;
  setDraft(patch: Partial<UserProfile>): void;
  setParq(key: ParqKey, value: boolean): void;
  setBaseline(patch: Partial<BaselineAnswers>): void;
  toggleLimitation(l: Limitation): void;
  toggleEquipment(e: Equipment): void;
  commit(): Promise<void>;
}

export const DEFAULT_DRAFT: UserProfile = {
  hunterName: '',
  age: 30,
  gender: 'male',
  weightKg: 80,
  heightCm: 172,
  waistCm: null,
  goal: 'habit',
  daysPerWeek: 3,
  sessionMinutes: 20,
  preferredTime: '19:00',
  location: 'home',
  equipment: ['none'],
  limitations: [],
  units: { mass: 'kg', length: 'cm' },
  locale: 'pt-BR',
  systemTone: 'cold',
};

export const DEFAULT_BASELINE: BaselineAnswers = { stairs: 1, pushups: 1, walk20: 1, detraining: 1 };

export const useOnboarding = create<OnboardingState>((set, get) => ({
  draft: DEFAULT_DRAFT,
  parq: {},
  baseline: DEFAULT_BASELINE,

  setDraft(patch) { set({ draft: { ...get().draft, ...patch } }); },
  setParq(key, value) { set({ parq: { ...get().parq, [key]: value } }); },
  setBaseline(patch) { set({ baseline: { ...get().baseline, ...patch } }); },

  toggleLimitation(l) {
    const cur = get().draft.limitations;
    set({ draft: { ...get().draft, limitations: cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l] } });
  },

  toggleEquipment(e) {
    const cur = get().draft.equipment;
    const next = cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e];
    // Peso corporal está sempre disponível.
    set({ draft: { ...get().draft, equipment: next.includes('none') ? next : ['none', ...next] } });
  },

  /**
   * Grava tudo de uma vez ao aceitar o Contrato: perfil, triagem, rank inicial
   * e a data de início da jornada.
   */
  async commit() {
    const { draft, parq } = get();
    const today = todayISO();
    await repositories.profile.save({ ...draft, hunterName: draft.hunterName.trim().toUpperCase() || 'CAÇADOR' });
    await repositories.screening.save(evaluateParq({ answers: parq, limitations: draft.limitations, date: today }));
    await repositories.events.append({
      id: 'placement', at: `${today}T12:00:00.000Z`, deviceId: getDeviceId(),
      kind: 'benchmark_passed', rankAfter: STARTING_RANK,
    });
    await repositories.profile.completeOnboarding(today);
  },
}));
