/** Constantes e cálculo compartilhados pelo backup nativo e web. */
/** Quando o último backup foi exportado (ISO). Ausente = nunca. */
export const LAST_BACKUP_KEY = 'last_backup_at';
/** A partir de quantos dias sem backup o app lembra. */
export const BACKUP_REMIND_DAYS = 7;

/** Dias desde o último backup; null = nunca exportou. */
export function daysSinceBackup(lastIso: string | null, nowIso: string): number | null {
  if (!lastIso) return null;
  return Math.max(0, Math.floor((Date.parse(nowIso) - Date.parse(lastIso)) / 86_400_000));
}
