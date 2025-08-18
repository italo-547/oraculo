#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RX_HAS_SPDX = /SPDX-License-Identifier:\s*MIT/;
const exts = new Set(['.ts', '.js', '.mjs', '.cjs']);

async function listFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (
        /^(node_modules|dist|coverage|.git|pre-public|tests|temp-fantasma|.abandonados|.deprecados|relatorios)$/i.test(
          e.name,
        )
      )
        continue;
      out.push(...(await listFiles(p)));
    } else if (e.isFile() && exts.has(path.extname(e.name))) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const LIST_ONLY = process.argv.includes('--list-missing') || process.argv.includes('--list');
  const CHECK_ONLY = process.argv.includes('--check') || process.argv.includes('--strict');
  const roots = ['src', 'scripts'];
  let scanned = 0,
    eligible = 0,
    changed = 0;
  const missing = [];
  const targets = [];
  for (const r of roots) {
    const base = path.join(ROOT, r);
    try {
      const files = await listFiles(base);
      targets.push(...files);
    } catch {}
  }
  for (const f of targets) {
    const rel = path.relative(ROOT, f);
    const relNorm = rel.replace(/\\/g, '/');
    scanned++;
    if (!relNorm.startsWith('src/') && !relNorm.startsWith('scripts/')) continue;
    eligible++;
    const buf = await fs.readFile(f, 'utf-8');
    if (RX_HAS_SPDX.test(buf)) continue;
    // Coletar para report se em modo lista/checagem
    if (LIST_ONLY || CHECK_ONLY) {
      missing.push(relNorm);
      continue;
    }
    const shebang = buf.startsWith('#!') ? buf.split('\n')[0] + '\n' : '';
    const rest = shebang ? buf.slice(shebang.length) : buf;
    const header = '// SPDX-License-Identifier: MIT\n';
    await fs.writeFile(f, shebang + header + rest, 'utf-8');
    console.log('SPDX inserido em:', relNorm);
    changed++;
  }
  if (LIST_ONLY || CHECK_ONLY) {
    if (missing.length) {
      console.log('Arquivos sem "SPDX-License-Identifier: MIT":');
      for (const m of missing) console.log(' -', m);
    } else {
      console.log('Todos os arquivos elegíveis já possuem SPDX.');
    }
    console.log(
      `Concluído. Escaneados: ${scanned} | Elegíveis: ${eligible} | Sem SPDX: ${missing.length}`,
    );
    if (CHECK_ONLY && missing.length) process.exitCode = 2;
    return;
  }
  console.log(
    `Concluído. Escaneados: ${scanned} | Elegíveis: ${eligible} | Atualizados: ${changed}`,
  );
}

main().catch((e) => {
  console.error('Falhou:', e?.message || e);
  process.exit(1);
});
