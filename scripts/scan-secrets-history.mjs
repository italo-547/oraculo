#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Scan simples do histórico git por padrões de segredos. NÃO envia nada para rede.
import { spawn } from 'node:child_process';

const PATTERNS = [
  /(aws|amazon)[_-]?(access|secret)[_-]?(key|id)\s*[:=]\s*([A-Za-z0-9\/+]{16,})/i,
  /(ghp|github_pat)_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/, // Slack tokens
  /-----BEGIN (RSA|DSA|EC) PRIVATE KEY-----/,
  /secret(?:s|_key|key)\s*[:=]\s*['\"][^'\"]{12,}['\"]/i,
  /jwt\s*[:=]\s*eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/i,
];

function streamScan({ maxCommits = 800 } = {}) {
  return new Promise((resolve, reject) => {
    const args = ['log', '-p', `--max-count=${maxCommits}`, '--no-color'];
    const child = spawn('git', args, { stdio: ['ignore', 'pipe', 'inherit'], shell: false });
    let leftover = '';
    let total = 0;
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      const data = leftover + chunk;
      const lines = data.split(/\r?\n/);
      leftover = lines.pop() ?? '';
      for (const ln of lines) {
        for (const rx of PATTERNS) {
          if (rx.test(ln)) {
            total++;
            break;
          }
        }
      }
    });
    child.on('error', reject);
    child.on('close', () => {
      if (leftover) {
        for (const rx of PATTERNS) {
          if (rx.test(leftover)) {
            total++;
            break;
          }
        }
      }
      resolve(total);
    });
  });
}

async function main() {
  try {
    const total = await streamScan({ maxCommits: 800 });
    if (total === 0) {
      console.log('OK: Nenhum padrão de segredo encontrado nos últimos 800 commits.');
    } else {
      console.warn(`ATENÇÃO: ${total} possíveis ocorrências encontradas no histórico recente.`);
      console.warn(
        'Recomenda-se executar ferramentas especializadas e revogar quaisquer chaves reais.',
      );
    }
  } catch (e) {
    console.error('Falha no scan de histórico:', e?.message || e);
    process.exitCode = 1;
  }
}

main();
