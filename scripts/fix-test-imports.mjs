// SPDX-License-Identifier: MIT
// Corrige imports relativos em tests/** para apontar para ../../src/**
// Regras:
// - Qualquer import/dynamic import/vi.mock/vi.doMock com spec iniciando por './' ou '../'
//   será reescrito para '../../src/<caminho normalizado a partir de tests/src>'
// - Mantém a extensão conforme no teste (normalmente .js para compat NodeNext/ESM)
// - Não altera imports bare (ex.: 'chalk', 'node:fs', '@alias/...') nem caminhos já em '../../src/'
// - Funciona com Windows e POSIX; sempre emite separadores POSIX ('/')

import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TESTS_ROOT = path.join(ROOT, 'tests');

/**
 * Lista recursivamente arquivos sob uma pasta
 */
async function listarArquivos(dir) {
  const out = [];
  async function walk(p) {
    const ents = await fs.readdir(p, { withFileTypes: true });
    for (const ent of ents) {
      const full = path.join(p, ent.name);
      if (ent.isDirectory()) await walk(full);
      else if (/\.(test|spec)\.ts$/.test(ent.name)) out.push(full);
    }
  }
  await walk(dir);
  return out;
}

function toPosix(p) {
  return p.split('\\').join('/');
}

/**
 * Dado o caminho do arquivo de teste, retorna o subcaminho relativo a tests/src
 * Ex.: C:\repo\tests\src\cli\foo.test.ts => 'cli'
 */
function subpastaTests(file) {
  const rel = toPosix(path.relative(TESTS_ROOT, path.dirname(file)));
  return rel === '' ? '' : rel; // pode ser '' na raiz
}

/**
 * Reescreve um spec relativo ('./' ou '../') para '../../src/<rel>' baseado em tests/src
 */
function rewriteRelative(spec, fileDirSubpath) {
  // Normaliza cálculo do caminho alvo como se a árvore src fosse espelhada em tests/src
  const cur = fileDirSubpath ? fileDirSubpath : '';
  const joined = path.posix.normalize(path.posix.join(cur, spec));
  // Evita escapar acima de tests/
  const normalized = joined.replace(/^\.+\//, '');
  const out = `../../src/${normalized}`;
  return out;
}

/**
 * Reescreve o conteúdo do arquivo
 */
function transformarCodigo(codigo, fileSubpath, fileAbsDir) {
  let mudou = false;
  const shouldRewrite = (spec) => {
    if (spec.startsWith('../../src/')) return false; // já ok
    // Ignora imports bare e de node:*
    if (!spec.startsWith('./') && !spec.startsWith('../')) return false;
    // Não reescreve quando alvo parece claramente um fixture/mocks
    const posix = toPosix(spec);
    if (/\/fixtures\//.test(posix) || /\/__fixtures__\//.test(posix) || /\/mocks?\//.test(posix)) {
      return false;
    }
    // Caso contrário, considera-se que pretendia apontar para o código fonte
    return true;
  };

  // 1) import ... from '...'
  codigo = codigo.replace(
    /(import\s+[^'"\n]+?from\s+)(["'])(\.{1,2}\/[^"']+?)\2/g,
    (m, p1, q, spec) => {
      if (!shouldRewrite(spec)) return m;
      const novo = rewriteRelative(spec, fileSubpath);
      mudou = true;
      return `${p1}${q}${novo}${q}`;
    },
  );

  // 2) import '...'
  codigo = codigo.replace(/(import\s*)(["'])(\.{1,2}\/[^"']+?)\2/g, (m, p1, q, spec) => {
    if (!shouldRewrite(spec)) return m;
    const novo = rewriteRelative(spec, fileSubpath);
    mudou = true;
    return `${p1}${q}${novo}${q}`;
  });

  // 3) dynamic import('...')
  codigo = codigo.replace(
    /(import\s*\()(\s*["'])(\.{1,2}\/[^"']+?)(["']\s*\))/g,
    (m, p1, q1, spec, q2) => {
      if (!shouldRewrite(spec)) return m;
      const novo = rewriteRelative(spec, fileSubpath);
      mudou = true;
      return `${p1}${q1}${novo}${q2}`;
    },
  );

  // 4) vi.mock('...') / vi.doMock('...') - vírgula opcional após o spec
  codigo = codigo.replace(
    /(vi\.(?:do)?mock\s*\()(\s*["'])(\.{1,2}\/[^"']+?)(["'])(\s*,)?/g,
    (m, p1, q1, spec, q2, comma = '') => {
      if (!shouldRewrite(spec)) return m;
      const novo = rewriteRelative(spec, fileSubpath);
      mudou = true;
      return `${p1}${q1}${novo}${q2}${comma}`;
    },
  );

  // 4b) Fallback para padrões que escapem da regex acima
  codigo = codigo.replace(/vi\.(?:do)?mock\(\s*(["'])(\.{1,2}\/[^"']+?)\1/g, (m, q, spec) => {
    if (!shouldRewrite(spec)) return m;
    const novo = rewriteRelative(spec, fileSubpath);
    mudou = true;
    return m.replace(spec, novo);
  });

  return { codigo, mudou };
}

async function main() {
  const arquivos = await listarArquivos(TESTS_ROOT);
  let alterados = 0;
  for (const arq of arquivos) {
    const conteudo = await fs.readFile(arq, 'utf-8');
    const sub = subpastaTests(arq);
    const { codigo, mudou } = transformarCodigo(conteudo, toPosix(sub), path.dirname(arq));
    if (mudou) {
      await fs.writeFile(arq, codigo, 'utf-8');
      alterados++;
      console.log('Atualizado:', toPosix(path.relative(ROOT, arq)));
    }
  }
  console.log(`\nReescrita concluída. Arquivos alterados: ${alterados} de ${arquivos.length}.`);
}

main().catch((err) => {
  console.error('Erro ao reescrever imports:', err);
  process.exitCode = 1;
});
