#!/usr/bin/env node
// SPDX-License-Identifier: MIT

import { readFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { execFile } from 'node:child_process';

function execFileAsync(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { shell: false, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout: stdout?.toString() ?? '' });
    });
  });
}

const { stdout } = await execFileAsync('git', ['ls-files', '*.md']);
const files = stdout
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .filter(
    (f) =>
      f !== 'docs/partials/AVISO-PROVENIENCIA.md' &&
      !f.startsWith('pre-public/') &&
      !f.startsWith('preview-oraculo/'),
  );

const marker = /Proveni[eê]ncia e Autoria/i;
const hasMarker = (text) => marker.test(text);

const missing = [];
for (const f of files) {
  try {
    await access(f, fsConstants.F_OK);
  } catch {
    console.warn(`[verificar-disclaimer] Ignorando (ausente no FS): ${f}`);
    continue;
  }
  const content = await readFile(f, 'utf8');
  const head = content.split('\n').slice(0, 30).join('\n');
  if (!hasMarker(head)) missing.push(f);
}

if (missing.length) {
  console.error(
    'Arquivos sem o aviso de Proveniência e Autoria (verifique as primeiras 30 linhas):',
  );
  for (const m of missing) console.error('-', m);
  process.exit(1);
} else {
  console.log('Todos os .md contêm o aviso de Proveniência e Autoria.');
}
