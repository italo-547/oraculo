#!/usr/bin/env node
/* eslint-disable no-console */
import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';

const disclaimerPath = 'docs/partials/AVISO-PROVENIENCIA.md';
await access(disclaimerPath, fsConstants.F_OK);
const disclaimer = await readFile(disclaimerPath, 'utf8');

function execFileAsync(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { shell: false, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout: stdout?.toString() ?? '' });
    });
  });
}

async function listMarkdown() {
  try {
    const { stdout } = await execFileAsync('git', ['ls-files', '*.md']);
    const listed = stdout.split('\n').map(s => s.trim()).filter(Boolean);
    if (listed.length) return listed;
  } catch { }
  // Fallback: varre FS a partir da raiz
  async function walk(dir) {
    const out = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/^(node_modules|dist|.git|pre-public|coverage|relatorios|.oraculo)$/i.test(e.name)) continue;
        out.push(...await walk(p));
      } else if (/\.md$/i.test(e.name)) {
        out.push(path.relative(process.cwd(), p));
      }
    }
    return out;
  }
  return await walk(process.cwd());
}

const files = (await listMarkdown())
  // ignore o próprio snippet e arquivos gerados
  .filter(f => f !== disclaimerPath && !f.startsWith('pre-public/'))
  // ignorar pastas históricas/abandonadas/deprecadas
  .filter(f => !f.startsWith('.abandonados/') && !f.startsWith('.deprecados/') && !f.startsWith('coverage/') && !f.startsWith('relatorios/'));

const marker = /Proveni[eê]ncia e Autoria/i;

let inserted = 0;
for (const f of files) {
  try {
    await access(f, fsConstants.F_OK);
  } catch {
    console.warn(`[add-disclaimer] Ignorando (ausente no FS): ${f}`);
    continue;
  }
  const content = await readFile(f, 'utf8');
  const head = content.split('\n').slice(0, 30).join('\n');
  if (marker.test(head)) continue;

  const updated = `${disclaimer}\n\n${content.trimStart()}\n`;
  await writeFile(f, updated, 'utf8');
  console.log(`Inserido aviso em: ${f}`);
  inserted++;
}
console.log(`Concluído. Arquivos atualizados: ${inserted}`)
