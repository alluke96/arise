#!/usr/bin/env node
/**
 * Build do app WEB / PWA (iPhone pela Tela de Início).
 *
 *   node scripts/build-web.mjs [saída=docs/app]
 *
 * Publicado pelo GitHub Pages a partir de `docs/` desta branch:
 * https://alluke96.github.io/arise/app/ (baseUrl /arise/app, aplicado pelo app.config.js com ARISE_WEB=1).
 *
 * 1. `expo export -p web` (com o baseUrl do app.json, ex.: /arise).
 * 2. Copia o SQLite WebAssembly (sql.js) para /vendor.
 * 3. Gera o service worker com a lista EXATA de arquivos do build e uma versão
 *    que muda quando qualquer arquivo muda — é o que faz o app abrir offline e
 *    se atualizar sozinho quando houver build novo.
 * 4. GitHub Pages: 404.html (rotas do app ao recarregar) e .nojekyll (senão a
 *    pasta _expo, que começa com "_", é ignorada).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = resolve(root, process.argv[2] ?? 'docs/app');

function walkFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}
const walk = walkFiles;

rmSync(out, { recursive: true, force: true });
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', out], {
  cwd: root, stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_DEMO: '0', ARISE_WEB: '1' },
});

// O Expo põe fontes e imagens em assets/node_modules/... — e o .gitignore
// ignora QUALQUER pasta node_modules: os arquivos nunca chegavam ao GitHub e o
// Pages respondia 404 (o service worker então nem instalava). Renomeia a
// pasta e reescreve as referências no código.
const nmFrom = join(out, 'assets', 'node_modules');
if (existsSync(nmFrom)) {
  renameSync(nmFrom, join(out, 'assets', 'npm'));
  for (const f of walkFiles(out).filter((p) => /\.(js|html|json|map)$/.test(p))) {
    const text = readFileSync(f, 'utf8');
    if (text.includes('/assets/node_modules/')) writeFileSync(f, text.split('/assets/node_modules/').join('/assets/npm/'));
  }
}

mkdirSync(join(out, 'vendor'), { recursive: true });
for (const f of ['sql-wasm.js', 'sql-wasm.wasm']) {
  copyFileSync(join(root, 'node_modules/sql.js/dist', f), join(out, 'vendor', f));
}

copyFileSync(join(out, 'index.html'), join(out, '404.html'));
writeFileSync(join(out, '.nojekyll'), '');
// Publicando em docs/app: o Pages lê a raiz de docs/. Lá precisam estar o
// .nojekyll, o 404.html (rotas do app ao recarregar) e um atalho para o app.
const pagesRoot = resolve(out, '..');
if (out.endsWith('/docs/app')) {
  writeFileSync(join(pagesRoot, '.nojekyll'), '');
  copyFileSync(join(out, 'index.html'), join(pagesRoot, '404.html'));
  writeFileSync(join(pagesRoot, 'index.html'),
    '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./app/"><a href="./app/">Arise</a>\n');
}


const files = walk(out)
  .map((p) => relative(out, p).split('\\').join('/'))
  .filter((f) => !['sw.js', '404.html', '.nojekyll'].includes(f))
  .sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(out, f)));
const version = hash.digest('hex').slice(0, 12);

const sw = `/* Gerado por scripts/build-web.mjs — não editar. */
const VERSION = ${JSON.stringify(version)};
const CACHE = 'arise-' + VERSION;
const BASE = new URL('./', self.location).href;
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)], null, 0)};

// Instala: baixa o app INTEIRO de uma vez. Só ativa se tudo chegou.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(new URL(f, BASE), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// Ativa: apaga caches de versões antigas. Os DADOS ficam no IndexedDB e não
// são tocados por aqui.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('arise-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Offline primeiro: tudo vem do cache. Navegação (abrir o app, recarregar
// numa rota) sempre recebe o index.html guardado.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.match(new URL('./index.html', BASE).href).then((r) => r || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
`;
writeFileSync(join(out, 'sw.js'), sw);

// Trava: nenhum arquivo do build pode estar no .gitignore, nem conter
// "node_modules" no caminho — senão o site publicado fica incompleto.
const bad = files.filter((f) => f.includes('node_modules'));
if (bad.length) throw new Error(`caminho com node_modules no build: ${bad[0]}`);
let ignored = '';
try {
  ignored = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], {
    cwd: root, input: files.map((f) => join(out, f)).join('\n'), encoding: 'utf8',
  }).trim();
} catch (e) {
  // check-ignore sai com código 1 quando NADA é ignorado: é o caso bom.
  if (e.status !== 1) throw e;
}
if (ignored) throw new Error(`arquivos do build ignorados pelo git:\n${ignored}`);

const size = files.reduce((a, f) => a + statSync(join(out, f)).size, 0);
console.log(`\nweb pronto em ${relative(root, out)}/ — ${files.length} arquivos, ${(size / 1024 / 1024).toFixed(1)} MB, versão ${version}`);
