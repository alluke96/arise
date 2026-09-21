import { create } from 'zustand';
import { applyXp } from '../../core/engine';
import { repositories } from '../../core/repositories';
import type { Progression, SessionSummary, UserProfile } from '../../core/types';
import { DEMO_PROFILE, DEMO_PROGRESSION } from '../../data/mocks/demo';

interface ProgressionState {
  profile: UserProfile;
  progression: Progression;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  awardSession: (session: SessionSummary, xp: number) => Promise<void>;
  setProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

/** Stores orquestram motor e repositórios. Nenhuma regra de negócio mora
 *  aqui — a regra vive no motor, que é testável sem React. */
export const useProgression = create<ProgressionState>((set, get) => ({
  profile: DEMO_PROFILE,
  progression: DEMO_PROGRESSION,
  hydrated: false,

  async hydrate() {
    const [profile, progression] = await Promise.all([
      repositories.profile.get(),
      repositories.progression.get(),
    ]);
    set({ profile: profile ?? DEMO_PROFILE, progression, hydrated: true });
  },

  async awardSession(session, xp) {
    const next = applyXp(get().progression, xp);
    await Promise.all([
      repositories.progression.save(next),
      repositories.quests.addSession(session),
    ]);
    set({ progression: next });
  },

  async setProfile(patch) {
    const next = { ...get().profile, ...patch };
    await repositories.profile.save(next);
    set({ profile: next });
  },
}));

/**
 * NÃO adicione selectors que montem objeto novo (`{...}`, `.map`, `.filter`).
 *
 * O Zustand v5 usa `useSyncExternalStore`, que compara snapshots por
 * REFERÊNCIA. Um selector que devolve objeto novo a cada chamada faz o React
 * ver um snapshot diferente em todo render e entrar em loop infinito
 * ("The result of getSnapshot should be cached" → "Maximum update depth
 * exceeded").
 *
 * Derive no render — `levelProgress(progression)` — ou use `useShallow`.
 */
