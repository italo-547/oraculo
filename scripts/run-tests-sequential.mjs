import { spawn } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';

// Script simples: encontra subdiretórios em tests/ e executa vitest run <dir> sequencialmente.
// Usa variáveis de ambiente para configurar timeout global.

const root = process.cwd();
const testsDir = path.join(root, 'tests');
const entries = readdirSync(testsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const VITEST_TIMEOUT = process.env.VITEST_TEST_TIMEOUT_MS || '300000';
process.env.VITEST_TEST_TIMEOUT_MS = VITEST_TIMEOUT;

async function runDir(dir) {
  return new Promise((resolve, reject) => {
    const abs = path.join('tests', dir);
    console.log(`
=== running tests for: ${abs} ===\n`);
    const ps = spawn('npx', ['vitest', 'run', abs, '--maxWorkers=1', '--reporter=dot'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    ps.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`vitest run ${abs} exited with ${code}`));
    });
    ps.on('error', (err) => reject(err));
  });
}

(async () => {
  try {
    for (const d of entries) {
      await runDir(d);
    }
    console.log('\nAll test directories completed successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Test run failed:', e.message);
    process.exit(1);
  }
})();
