import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {
  buildBundle, parseBundle, restoreBundle, serializeBundle, suggestedFileName, type RestoreReport,
} from '../../core/db/backup';
import { repositories } from '../../core/repositories';
import { nowISO } from '../../core/clock';

export { BACKUP_REMIND_DAYS, LAST_BACKUP_KEY, daysSinceBackup } from './common';
import { LAST_BACKUP_KEY } from './common';

/**
 * Exportação e importação em arquivo (R12.4, R12.5).
 *
 * A lógica — montar, validar, restaurar por união — é pura e testada em
 * `core/db/backup.ts`. Aqui só se lê e escreve arquivo.
 */
export async function exportToFile(): Promise<{ events: number; bytes: number } | null> {
  const quests = await repositories.quests.between('1970-01-01', '9999-12-31');
  const bundle = await buildBundle(repositories, new Date().toISOString(), quests);
  const json = serializeBundle(bundle);
  const file = new File(Paths.cache, suggestedFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  }
  await repositories.app.setValue(LAST_BACKUP_KEY, nowISO());
  return { events: bundle.events.length, bytes: json.length };
}

/** Valida ANTES de escrever: arquivo ruim nunca toca no histórico. */
export async function importFromFile(): Promise<RestoreReport | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const raw = await new File(picked.assets[0].uri).text();
  const bundle = parseBundle(raw);
  return restoreBundle(repositories, bundle);
}
