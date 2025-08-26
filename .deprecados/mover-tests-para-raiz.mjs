#!/usr/bin/env node
// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();

async function listarArquivos(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!d) break;
    let entries = [];
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        // ignora node_modules, dist, build, coverage, .oraculo
        const nome = e.name;
        if (
          ['node_modules', 'dist', 'build', 'coverage', '.oraculo', '.git', 'tests'].includes(nome)
        )
          continue;
        stack.push(p);
      } else {
        out.push(p);
      }
    }
  }
  return out;
}

function ehTeste(file) {
  return /(\.|\/)(test|spec)\.(t|j)sx?$/i.test(file);
}

function relativoSrc(file) {
  const norm = file.replace(/\\/g, '/');
  const idx = norm.indexOf('/src/');
  if (idx >= 0) return norm.substring(idx + 5); // após 'src/'
  if (norm.startsWith('src/')) return norm.substring(4);
  return null;
}

async function main() {
  const srcDir = path.join(baseDir, 'src');
  const existeSrc = await fs
    .stat(srcDir)
    .then(() => true)
    .catch(() => false);
  if (!existeSrc) {
    console.error('Pasta src/ não encontrada.');
    process.exit(1);
  }

  // Carrega mover do dist e liga AUTO_FIX
  const cosmos = await import(path.join(baseDir, 'dist', 'nucleo', 'constelacao', 'cosmos.js'));
  cosmos.config.STRUCTURE_AUTO_FIX = true;
  const { corrigirEstrutura } = await import(
    path.join(baseDir, 'dist', 'zeladores', 'corretor-estrutura.js')
  );

  const todos = await listarArquivos(srcDir);
  const candidatos = todos.filter((f) => ehTeste(f));
  const mapa = [];
  for (const abs of candidatos) {
    const rel = path.posix.normalize(path.relative(baseDir, abs).replace(/\\/g, '/'));
    const relSrc = relativoSrc(rel);
    if (!relSrc) continue; // fora de src
    const dirRel = path.posix.dirname(relSrc);
    const idealDir = dirRel && dirRel !== '.' ? path.posix.join('tests', dirRel) : 'tests';
    mapa.push({ arquivo: rel, ideal: idealDir, atual: rel });
  }

  if (!mapa.length) {
    console.log('Nenhum arquivo de teste encontrado em src/.');
    return;
  }
  console.log(`Movendo ${mapa.length} arquivos de teste para tests/...`);
  await corrigirEstrutura(mapa, [], baseDir);
  console.log('Concluído.');
}

main().catch((e) => {
  console.error('Falha:', e?.message || e);
  process.exit(1);
});
