import { create } from 'zustand';
import { ADMIN_PASSWORD, ADMIN_USER } from '../../core/config';
import { repositories } from '../../core/repositories';

/**
 * Login do build de teste pessoal.
 *
 * ⚠️ Não é autenticação: usuário e senha estão no código (`core/config.ts`)
 * e a sessão é só uma marca no banco local. Serve para o app não abrir
 * direto no telefone de quem pegar o aparelho — nada além disso. Quando
 * houver conta de verdade, isto dá lugar ao Supabase Auth (backend, tarefa 10).
 */
const SESSION_KEY = 'admin_session';

interface AuthState {
  loggedIn: boolean;
  hydrate(): Promise<void>;
  login(user: string, password: string): Promise<boolean>;
  logout(): Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  loggedIn: false,

  async hydrate() {
    set({ loggedIn: (await repositories.app.getValue(SESSION_KEY)) === ADMIN_USER });
  },

  async login(user, password) {
    const ok = user.trim().toLowerCase() === ADMIN_USER && password === ADMIN_PASSWORD;
    if (ok) {
      await repositories.app.setValue(SESSION_KEY, ADMIN_USER);
      set({ loggedIn: true });
    }
    return ok;
  },

  async logout() {
    await repositories.app.setValue(SESSION_KEY, '');
    set({ loggedIn: false });
  },
}));
