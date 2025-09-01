// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { execSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function garantirBuild() {
  const cliPath = resolve('dist/cli.js');
  if (!existsSync(cliPath)) {
    execSync('npm run build', { stdio: 'inherit' });
  }
  return cliPath;
}

describe('@e2e Reestruturar', () => {
  it('@e2e reescreve imports relativos ao mover arquivo (AUTO_FIX)', async () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-move-'));

    // Config para permitir auto-fix
    writeFileSync(
      join(tempDir, 'oraculo.config.json'),
      JSON.stringify({ STRUCTURE_AUTO_FIX: true }, null, 2),
      'utf-8',
    );
    // Projeto mínimo
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-rewrite', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    mkdirSync(join(tempDir, 'src', 'utils'));
    writeFileSync(join(tempDir, 'src', 'utils', 'a.ts'), 'export const A=1;', 'utf-8');
    // Arquivo com padrão de nome que será movido para domains/<entidade>/controllers
    writeFileSync(
      join(tempDir, 'src', 'pedido.controller.ts'),
      "import { A } from '../../src/cli/utils/a';\nexport const ctrl=()=>A;\n",
      'utf-8',
    );

    const loader = pathToFileURL(resolve('node.loader.mjs')).toString();
    // usa spawn assíncrono para não bloquear o loop do worker (evita timeout RPC do Vitest)
    const run = () =>
      new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
        const cp = spawn(
          process.execPath,
          [
            '--loader',
            loader,
            cliPath,
            'reestruturar',
            '--auto',
            '--domains',
            '--prefer-estrategista',
            '--silence',
          ],
          {
            cwd: tempDir,
            env: { ...process.env },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        let stdout = '';
        let stderr = '';
        cp.stdout?.on('data', (d) => (stdout += String(d)));
        cp.stderr?.on('data', (d) => (stderr += String(d)));
        cp.on('close', (code) => resolve({ status: code, stdout, stderr }));
        cp.on('error', (err) =>
          resolve({ status: null, stdout, stderr: stderr + '\n[error: ' + err.message + ']' }),
        );
        // safety timeout aumentado
        setTimeout(() => {
          try {
            cp.kill('SIGKILL');
          } catch {}
          resolve({ status: null, stdout, stderr: stdout + stderr + '\n[timeout 60s]' });
        }, 60000);
      });

    const proc = await run();
    expect(proc.status).toBe(0);

    // Verifica que o arquivo foi movido e imports reescritos
    const destino = join(
      tempDir,
      'src',
      'domains',
      'pedido',
      'controllers',
      'pedido.controller.ts',
    );
    expect(existsSync(destino)).toBe(true);
    const conteudo = readFileSync(destino, 'utf-8');
    // Agora o caminho relativo deve subir 3 níveis (src/domains/pedido/controllers → src/utils)
    expect(conteudo).toMatch(/from '\.\.\/\.\.\/\.\.\/utils\/a'/);
    // Origem não deve mais existir
    expect(existsSync(join(tempDir, 'src', 'pedido.controller.ts'))).toBe(false);
  }, 60000);

  it('@e2e dry-run (--somente-plano) não aplica mudanças e exibe plano', async () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-dry-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-dry', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    writeFileSync(join(tempDir, 'src', 'cliente.controller.ts'), 'export const x=1;', 'utf-8');

    const loader = pathToFileURL(resolve('node.loader.mjs')).toString();
    const runDry = () =>
      new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
        const cp = spawn(
          process.execPath,
          [
            '--loader',
            loader,
            cliPath,
            'reestruturar',
            '--domains',
            '--prefer-estrategista',
            '--somente-plano',
          ],
          {
            cwd: tempDir,
            env: { ...process.env },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        let stdout = '';
        let stderr = '';
        cp.stdout?.on('data', (d) => (stdout += String(d)));
        cp.stderr?.on('data', (d) => (stderr += String(d)));
        cp.on('close', (code) => resolve({ status: code, stdout, stderr }));
        cp.on('error', (err) =>
          resolve({ status: null, stdout, stderr: stderr + '\n[error: ' + err.message + ']' }),
        );
        setTimeout(() => {
          try {
            cp.kill('SIGKILL');
          } catch {}
          resolve({ status: null, stdout, stderr: stdout + stderr + '\n[timeout 60s]' });
        }, 60000);
      });

    const proc = await runDry();
    // Espera término com sucesso
    expect(proc.status).toBe(0);
    const stdout = proc.stdout || '';
    // Deve mencionar plano sugerido ou dry-run
    expect(stdout.toLowerCase()).toMatch(/plano|dry-run/);
    // Arquivo permanece no lugar
    expect(existsSync(join(tempDir, 'src', 'cliente.controller.ts'))).toBe(true);
  }, 60000);

  it('@e2e conflito de destino existente não move e exibe conflitos (dry-run)', async () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-conf-'));
    // Sem auto-fix: vamos rodar em dry-run
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-conf', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    // Origem que será movida
    writeFileSync(join(tempDir, 'src', 'cliente.controller.ts'), 'export const y=1;', 'utf-8');
    // Cria o destino já existente para provocar conflito
    const destinoDir = join(tempDir, 'src', 'domains', 'cliente', 'controllers');
    mkdirSync(destinoDir, { recursive: true });
    writeFileSync(join(destinoDir, 'cliente.controller.ts'), '// existente', 'utf-8');

    const loader = pathToFileURL(resolve('node.loader.mjs')).toString();
    const runConf = () =>
      new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
        const cp = spawn(
          process.execPath,
          [
            '--loader',
            loader,
            cliPath,
            'reestruturar',
            '--domains',
            '--prefer-estrategista',
            '--somente-plano',
          ],
          {
            cwd: tempDir,
            env: { ...process.env },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        let stdout = '';
        let stderr = '';
        cp.stdout?.on('data', (d) => (stdout += String(d)));
        cp.stderr?.on('data', (d) => (stderr += String(d)));
        cp.on('close', (code) => resolve({ status: code, stdout, stderr }));
        cp.on('error', (err) =>
          resolve({ status: null, stdout, stderr: stderr + '\n[error: ' + err.message + ']' }),
        );
        setTimeout(() => {
          try {
            cp.kill('SIGKILL');
          } catch {}
          resolve({ status: null, stdout, stderr: stdout + stderr + '\n[timeout 60s]' });
        }, 60000);
      });

    const proc = await runConf();
    // CLI não deve falhar; deve registrar conflitos e não aplicar
    expect(proc.status).toBe(0);
    const stdout = (proc.stdout || '') + (proc.stderr || '');
    expect(stdout).toMatch(/Conflitos/);
    // Origem ainda existe (não movida, dry-run)
    expect(existsSync(join(tempDir, 'src', 'cliente.controller.ts'))).toBe(true);
    // Destino preservado
    const conteudoDestino = readFileSync(join(destinoDir, 'cliente.controller.ts'), 'utf-8');
    expect(conteudoDestino).toContain('existente');
  }, 60000);
});
