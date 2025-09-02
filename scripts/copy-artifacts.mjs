#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copia artefatos não-transpilados para dist (ex.: ESM loader)
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copy(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
  console.log(`[copy] ${src} -> ${dest}`);
}

async function main() {
  const root = process.cwd();
  const loaderSrc = path.join(root, 'src', 'node.loader.mjs');
  const loaderDest = path.join(root, 'dist', 'node.loader.mjs');
  try {
    await copy(loaderSrc, loaderDest);
  } catch (e) {
    console.warn('[copy] Aviso: não foi possível copiar node.loader.mjs:', e.message);
  }
}

main().catch((e) => {
  console.error('[copy] Falha ao copiar artefatos:', e);
  process.exit(1);
});
