import type { Repositories } from '../repositories/types';
import type { DomainEvent } from '../sync/events';
import type {
  DailyQuest, HealthScreening, PainLogEntry, SessionSummary, UserProfile,
} from '../types';

export const EXPORT_FORMAT = 'arise.export' as const;
export const EXPORT_VERSION = 1 as const;

/**
 * Envelope de exportação.
 *
 * R12.6 — a exportação NUNCA é bloqueada, nem depois que a assinatura acaba.
 * Cobrar para a pessoa recuperar o que ela mesma registrou seria abusivo e
 * provavelmente fere o CDC.
 */
export interface ExportBundle {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  profile: UserProfile | null;
  screening: HealthScreening | null;
  events: DomainEvent[];
  sessions: SessionSummary[];
  quests: DailyQuest[];
  shadows: { id: string; unlockedAt: string }[];
  pain: PainLogEntry[];
}

export async function buildBundle(
  repos: Repositories,
  now = new Date().toISOString(),
  quests: DailyQuest[] = [],
): Promise<ExportBundle> {
  const [profile, screening, events, sessions, shadows, pain] = await Promise.all([
    repos.profile.get(),
    repos.screening.getLatest(),
    repos.events.all(),
    repos.quests.recentSessions(100000),
    repos.shadows.all(),
    repos.pain.all(),
  ]);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now,
    profile,
    screening,
    events,
    sessions,
    quests,
    shadows: shadows
      .filter((s): s is typeof s & { unlockedAt: string } => s.unlockedAt !== null)
      .map((s) => ({ id: s.id, unlockedAt: s.unlockedAt })),
    pain,
  };
}

export class InvalidBundleError extends Error {
  constructor(reason: string) {
    super(`Arquivo de backup inválido: ${reason}`);
    this.name = 'InvalidBundleError';
  }
}

/**
 * Valida antes de tocar em qualquer dado.
 *
 * Importar um arquivo corrompido por cima de um histórico real destruiria
 * meses de treino, então a validação é estrita e acontece ANTES da escrita.
 */
export function parseBundle(raw: string): ExportBundle {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new InvalidBundleError('não é JSON');
  }
  if (typeof data !== 'object' || data === null) throw new InvalidBundleError('não é um objeto');

  const b = data as Partial<ExportBundle>;
  if (b.format !== EXPORT_FORMAT) throw new InvalidBundleError('não é um backup do Arise');
  if (typeof b.version !== 'number') throw new InvalidBundleError('sem versão');
  if (b.version > EXPORT_VERSION) {
    throw new InvalidBundleError(
      `foi gerado por uma versão mais nova do app (v${b.version})`,
    );
  }
  for (const key of ['events', 'sessions', 'quests', 'shadows', 'pain'] as const) {
    if (!Array.isArray(b[key])) throw new InvalidBundleError(`campo "${key}" ausente ou inválido`);
  }
  for (const e of b.events as DomainEvent[]) {
    if (!e || typeof e.id !== 'string' || typeof e.at !== 'string' || typeof e.kind !== 'string') {
      throw new InvalidBundleError('há evento malformado');
    }
  }
  return b as ExportBundle;
}

export interface RestoreReport {
  events: number;
  sessions: number;
  quests: number;
  shadows: number;
  pain: number;
  profileRestored: boolean;
}

/**
 * Restaura por UNIÃO, não por substituição: evento com id já conhecido é
 * ignorado. Importar o backup de um aparelho no outro funde os dois
 * históricos em vez de um sobrescrever o outro.
 *
 * Sombras e dor NÃO são reinseridas pela API de alto nível: elas são
 * projeções do log, e chamar `unlock`/`add` aqui emitiria eventos novos por
 * cima dos que já vieram no backup — foi exatamente o que duplicava dado
 * numa versão anterior desta função. Só entram como evento sintético quando
 * o backup não traz o evento correspondente (formato antigo).
 */
export async function restoreBundle(
  repos: Repositories, bundle: ExportBundle,
): Promise<RestoreReport> {
  if (bundle.profile) await repos.profile.save(bundle.profile);
  if (bundle.screening) await repos.screening.save(bundle.screening);

  for (const e of bundle.events) await repos.events.append(e);
  for (const q of bundle.quests) await repos.quests.save(q);

  const known = new Set(bundle.events.map((e) => e.id));
  for (const s of bundle.shadows) {
    if (known.has(`shadow:${s.id}`)) continue;
    await repos.events.append({
      id: `shadow:${s.id}`, at: s.unlockedAt, deviceId: 'import',
      kind: 'shadow_unlocked', shadowId: s.id,
    });
  }
  for (const p of bundle.pain) {
    const id = `pain:${p.date}:${p.pattern}:${p.kind}`;
    if (known.has(id)) continue;
    await repos.events.append({
      id, at: `${p.date}T12:00:00.000Z`, deviceId: 'import',
      kind: 'pain_logged', pattern: p.pattern, painKind: p.kind,
    });
  }

  await repos.events.refold();

  return {
    events: bundle.events.length,
    sessions: bundle.sessions.length,
    quests: bundle.quests.length,
    shadows: bundle.shadows.length,
    pain: bundle.pain.length,
    profileRestored: bundle.profile !== null,
  };
}

export function serializeBundle(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function suggestedFileName(now = new Date()): string {
  return `arise-backup-${now.toISOString().slice(0, 10)}.json`;
}
