// SPDX-License-Identifier: MIT
import fs from 'fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'preview-oraculo');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copySafe(src, dest) {
  await fs.cp(src, dest, { recursive: true, force: true });
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('[preview-oraculo] buildando projeto...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('[preview-oraculo] limpando pasta alvo...');
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await ensureDir(OUT_DIR);

  console.log('[preview-oraculo] copiando dist...');
  if (!(await exists(DIST))) throw new Error('dist não encontrado após o build');
  await copySafe(DIST, path.join(OUT_DIR, 'dist'));

  console.log('[preview-oraculo] copiando docs (se existir)...');
  if (await exists(DOCS)) {
    await copySafe(DOCS, path.join(OUT_DIR, 'docs'));
  }

  console.log('[preview-oraculo] copiando arquivos de raiz...');
  const rootFiles = [
    'README.md',
    'LICENSE',
    'THIRD-PARTY-NOTICES.txt',
    'package.json',
    'oraculo.config.json',
    'oraculo.config.safe.json',
    'tsconfig.json',
    'tsconfig.eslint.json',
  ];
  for (const f of rootFiles) {
    const src = path.join(ROOT, f);
    if (await exists(src)) {
      await copySafe(src, path.join(OUT_DIR, f));
    }
  }

  // Inserir aviso de Proveniência/Autoria no topo dos .md dentro de pre-public
  try {
    const avisoPath = path.join(ROOT, 'docs', 'partials', 'AVISO-PROVENIENCIA.md');
    const aviso = await fs.readFile(avisoPath, 'utf-8');
    const marker = /Proveni[eê]ncia\s+e\s+Autoria/i;
    async function listMarkdown(dir) {
      const acc = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) acc.push(...(await listMarkdown(p)));
        else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) acc.push(p);
      }
      return acc;
    }
    const mdFiles = await listMarkdown(OUT_DIR);
    for (const f of mdFiles) {
      if (path.basename(f).toLowerCase() === 'preview.md') continue;
      let c = await fs.readFile(f, 'utf-8');
      const head = c.split(/\r?\n/).slice(0, 30).join('\n');
      if (!marker.test(head)) {
        await fs.writeFile(f, `${aviso}\n\n${c.trimStart()}\n`, 'utf-8');
      }
    }
    console.log('[preview-oraculo] Aviso de proveniência inserido nos .md de preview-oraculo.');
  } catch (e) {
    console.warn('[preview-oraculo] Aviso de proveniência não inserido:', e?.message || e);
  }

  // Cria um arquivo indicador de prévia de revisão
  const previewNote = `# Prévia de Publicação (Review)

Este diretório foi gerado pelo script pre-public para revisão do que seria publicado.

- Conteúdos aqui refletem o estado atual de build (dist/) e documentação (docs/).
- Alterações devem ser feitas na raiz do projeto e o script reexecutado.
- Este arquivo não será incluído em publicação real; serve apenas como aviso/guia de revisão.

Data/Horário de geração: ${new Date().toISOString()}
`;
  await fs.writeFile(path.join(OUT_DIR, 'PREVIEW.md'), previewNote, 'utf-8');

  console.log('[preview-oraculo] pronto. Veja a pasta preview-oraculo/.');
}

main().catch((e) => {
  console.error('[preview-oraculo] falhou:', e?.message || e);
  process.exit(1);
});
