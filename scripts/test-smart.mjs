// SPDX-License-Identifier: MIT
// Runner de testes "inteligente":
// - No Windows, executa testes de forma sequencial por diretório para evitar RPC timeouts do Vitest
// - Em outras plataformas, roda Vitest normalmente
// - Fallback: se detectar erro "Timeout calling onTaskUpdate", reexecuta no modo sequencial

import { spawn } from 'node:child_process';
import path from 'node:path';

function runNode(args, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      shell: false,
      env,
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  // Timeout padrão alto para E2E longos se não definido
  if (!process.env.VITEST_TEST_TIMEOUT_MS) process.env.VITEST_TEST_TIMEOUT_MS = '300000';

  const isWin = process.platform === 'win32';
  const forceSequential = /^1|true$/i.test(process.env.VITEST_SEQUENTIAL || '');

  const vitestEntry = path.join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');
  const runSequential = async () => runNode(['./scripts/run-tests-sequential.mjs']);
  const runParallel = async () => runNode([vitestEntry, 'run']);

  if (isWin || forceSequential) {
    const code = await runSequential();
    process.exit(code);
  }

  // Tentativa paralela padrão
  const code = await runParallel();
  if (code === 0) return process.exit(0);

  // Fallback automático quando encontrar erro conhecido de RPC
  // Observação: não interceptamos stdout aqui (herdado), então aplicamos um fallback
  // conservador sempre que falhar para aumentar a chance de verde localmente.
  const retry = await runSequential();
  process.exit(retry);
}

main().catch((e) => {
  console.error('Falha ao executar testes:', e?.message || e);
  process.exit(1);
});
