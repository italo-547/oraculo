#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Varre Markdown e adiciona tags de linguagem em fences ``` sem linguagem definida.
// Heurística simples: powershell se contém `$env:` ou `; npm`, bash se contém `npm ` ou `node `, json se começa com {, ts se tem `import`/`export` e `.ts`, caso contrário deixa como `text`.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

async function listMarkdown(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/^(node_modules|dist|coverage|pre-public|preview-oraculo|\.git)$/i.test(e.name)) continue;
      out.push(...(await listMarkdown(p)));
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

function guessLang(block) {
  const head = block.slice(0, 200).trim();
  if (/^\{[\s\S]*\}$/.test(head)) return 'json';
  if (/\$env:|PowerShell/i.test(block)) return 'powershell';
  if (/^#\!\/usr\/bin\/(env\s+)?bash|\bnpm\s|\bnode\s|\bbash\b/i.test(block)) return 'bash';
  if (/import\s.+from|export\s+(const|function|default)/.test(block)) return 'ts';
  if (/"?type"?\s*:\s*"module"/.test(block)) return 'json';
  return 'text';
}

function fixFences(content) {
  // procura ```\n (sem linguagem) e tenta identificar o bloco correspondente
  const lines = content.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```\s*$/.test(line)) {
      // começo de fence sem linguagem
      const start = i;
      i++;
      const buf = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      const end = i; // linha com ``` de fechamento ou EOF
      const lang = guessLang(buf.join('\n'));
      out.push('```' + lang);
      out.push(...buf);
      if (i < lines.length) {
        out.push('```');
        i++; // consumir fechamento
      }
    } else {
      out.push(line);
      i++;
    }
  }
  return out.join('\n');
}

async function main() {
  const files = await listMarkdown(ROOT);
  let changed = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    if (rel.startsWith('pre-public/') || rel.includes('/legado/')) continue;
    const c = await fs.readFile(f, 'utf-8');
    if (!/```\s*\n/.test(c)) continue;
    const u = fixFences(c);
    if (u !== c) {
      await fs.writeFile(f, u, 'utf-8');
      console.log('Fences corrigidos:', rel);
      changed++;
    }
  }
  console.log('Concluído. Arquivos alterados:', changed);
}

main().catch((e) => {
  console.error('Falha:', e?.message || e);
  process.exit(1);
});
