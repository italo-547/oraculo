#!/usr/bin/env node
// Converte imports relativos que apontam para pastas do src/ para aliases do tsconfig
// Uso: node scripts/convert-to-aliases.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SRC = path.join(root, 'src');

// Map de pastas alvo -> alias prefix
const MAP = {
  nucleo: '@nucleo',
  analistas: '@analistas',
  arquitetos: '@arquitetos',
  zeladores: '@zeladores',
  relatorios: '@relatorios',
  tipos: '@tipos',
  guardian: '@guardian',
  constelacao: '@constelacao',
};

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (/\.ts$/.test(e.name) || /\.js$/.test(e.name)) files.push(p);
  }
  return files;
}

function replaceOnce(content, folder, alias) {
  // Replace occurrences like from '../../.../folder/...' or import "../../folder/..."
  // We only replace when after the ../ sequences the folder name appears (not when it's part of filename)
  // Build regexp safely
  const pattern =
    '([\\"\'])\\.{1,2}(?:\\/\\.{1,2})*' + folder.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\/';
  const re = new RegExp(pattern, 'g');
  return content.replace(re, (m, quote) => `${quote}${alias}/`);
}

async function main() {
  console.log('Iniciando conversão de imports relativos para aliases...');
  const files = await walk(SRC);
  const changed = [];
  for (const file of files) {
    let txt = await fs.readFile(file, 'utf8');
    let original = txt;
    for (const [folder, alias] of Object.entries(MAP)) {
      txt = replaceOnce(txt, folder, alias);
    }
    if (txt !== original) {
      await fs.writeFile(file, txt, 'utf8');
      changed.push(path.relative(root, file));
    }
  }
  if (!changed.length) console.log('Nenhuma alteração necessária.');
  else {
    console.log('Arquivos modificados:');
    for (const f of changed) console.log(' -', f);
  }
}

main().catch((err) => {
  console.error('Falha ao executar:', err);
  process.exitCode = 1;
});
