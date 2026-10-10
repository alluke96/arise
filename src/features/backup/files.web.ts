import {
  buildBundle, parseBundle, restoreBundle, serializeBundle, suggestedFileName, type RestoreReport,
} from '../../core/db/backup';
import { repositories } from '../../core/repositories';
import { nowISO } from '../../core/clock';
import { LAST_BACKUP_KEY } from './common';

export { BACKUP_REMIND_DAYS, LAST_BACKUP_KEY, daysSinceBackup } from './common';

/**
 * Backup na WEB (app instalado na Tela de Início do iPhone).
 *
 * Exportar abre a folha de compartilhamento do iOS com o arquivo — dá para
 * salvar em Arquivos/iCloud Drive, mandar por e-mail ou WhatsApp. Sem suporte
 * a compartilhar arquivo, baixa. Mesma validação e mesmo restauro por união
 * do app nativo (`core/db/backup.ts`).
 */
export async function exportToFile(): Promise<{ events: number; bytes: number } | null> {
  const quests = await repositories.quests.between('1970-01-01', '9999-12-31');
  const bundle = await buildBundle(repositories, nowISO(), quests);
  const json = serializeBundle(bundle);
  const name = suggestedFileName();
  const file = new File([json], name, { type: 'application/json' });

  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: name });
    } catch (e) {
      // Fechou a folha sem escolher destino: nada foi salvo.
      if (e instanceof DOMException && e.name === 'AbortError') return null;
      throw e;
    }
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  await repositories.app.setValue(LAST_BACKUP_KEY, nowISO());
  return { events: bundle.events.length, bytes: json.length };
}

/** Abre o seletor de arquivo. Resolve `null` se a pessoa cancelar. */
function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    let done = false;
    const finish = (f: File | null) => {
      if (done) return;
      done = true;
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(f);
    };
    // Nem todo Safari dispara "cancel": ao voltar o foco sem arquivo, é cancelamento.
    const onFocus = () => setTimeout(() => finish(input.files?.[0] ?? null), 1000);
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

/** Valida ANTES de escrever: arquivo ruim nunca toca no histórico. */
export async function importFromFile(): Promise<RestoreReport | null> {
  const file = await pickJsonFile();
  if (!file) return null;
  const bundle = parseBundle(await file.text());
  return restoreBundle(repositories, bundle);
}
