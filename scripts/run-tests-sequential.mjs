import { spawn } from 'child_process';
import { readdirSync, statSync } from 'fs';
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

const vitestEntry = path.join(root, 'node_modules', 'vitest', 'vitest.mjs');

function runVitest(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(process.execPath, [vitestEntry, ...args], {
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, ...extraEnv },
    });
    ps.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`vitest ${args.join(' ')} exited with ${code}`)),
    );
    ps.on('error', (err) => reject(err));
  });
}

async function runDir(dir) {
  return new Promise((resolve, reject) => {
    const abs = path.join('tests', dir);
    console.log(`
=== running tests for: ${abs} ===\n`);
    runVitest(['run', abs, '--maxWorkers=1', '--reporter=dot'])
      .then(() => resolve())
      .catch((e) => reject(e));
  });
}

function walkFiles(startDir) {
  const files = [];
  const stack = [startDir];
  while (stack.length) {
    const cur = stack.pop();
    const items = readdirSync(cur);
    for (const it of items) {
      const full = path.join(cur, it);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else files.push(full);
    }
  }
  return files;
}

function hasTests(dir) {
  try {
    const files = walkFiles(dir);
    return files.some((f) => /\.((test|spec))\.[cm]?[jt]sx?$/.test(f));
  } catch {
    return false;
  }
}

async function runCliFilesSequential() {
  const cliDir = path.join(testsDir, 'cli');
  const all = walkFiles(cliDir)
    .filter((f) => /\.test\.[cm]?[jt]sx?$/.test(f))
    .sort();
  console.log(`Found ${all.length} CLI test files. Running one by one...`);
  for (const file of all) {
    // Use paths with forward slashes to avoid escaping issues on Windows
    const rel = path.relative(root, file).split(path.sep).join('/');
    console.log(`\n=== running test file: ${rel} ===\n`);
    if (rel.endsWith('tests/cli/e2e-bin.test.ts')) {
      // Divide por casos -t para reduzir duração contínua e evitar timeouts do RPC
      const fs = await import('fs');
      const txt = fs.readFileSync(file, 'utf-8');
      const names = Array.from(txt.matchAll(/\bit\s*\(\s*(["'`])(.+?)\1/g)).map((m) => m[2]);
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const name of names) {
        console.log(`\n=== running e2e test case: ${name} ===\n`);
        // Não ancorar para casar dentro do "full name" (inclui describes):
        const pattern = `${escapeRegex(name)}`;
        await runVitest(['run', rel, '-t', pattern, '--maxWorkers=1', '--reporter=dot'], {
          VITEST: '1',
          VITEST_MAX_WORKERS: '1',
          VITEST_POOL: 'forks',
        });
      }
      continue;
    }
    await runVitest(['run', rel, '--maxWorkers=1', '--reporter=dot'], {
      VITEST: '1',
      VITEST_MAX_WORKERS: '1',
      VITEST_POOL: 'forks',
    });
  }
}

(async () => {
  try {
    for (const d of entries) {
      const absDir = path.join(testsDir, d);
      if (d === 'cli') {
        await runCliFilesSequential();
      } else if (d === 'fixtures' || d === 'tmp' || !hasTests(absDir)) {
        console.log(`Skipping directory without tests: ${absDir}`);
        continue;
      } else {
        await runDir(d);
      }
    }
    console.log('\nAll test directories completed successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Test run failed:', e.message);
    process.exit(1);
  }
})();
