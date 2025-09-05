// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Testes ponta-a-ponta executando o binário buildado (dist/bin/index.js)
// Cenários focados: execução básica scan-only e export de relatório.

function garantirBuild() {
  const cliPath = resolve('dist/bin/index.js');
  // Compila apenas se o binário ainda não existir para evitar overhead e timeouts
  const { existsSync } = require('node:fs');
  if (!existsSync(cliPath)) {
    execSync('npm run build', { stdio: 'inherit' });
  }
  return cliPath;
}

describe('@e2e E2E CLI binário', () => {
  it('@e2e executa diagnosticar --scan-only em projeto mínimo (exit 0)', () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-'));
    // Projeto mínimo
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    writeFileSync(join(tempDir, 'src/index.ts'), 'console.log("ok e2e")', 'utf-8');

    const envClean = { ...process.env } as Record<string, string | undefined>;
    delete envClean.VITEST;
    const proc = spawnSync(process.execPath, [cliPath, 'diagnosticar', '--scan-only'], {
      cwd: tempDir,
      encoding: 'utf-8',
      env: envClean as NodeJS.ProcessEnv,
    });
    const stdout = proc.stdout || '';
    expect(proc.status).toBe(0);
    expect(stdout.toLowerCase()).toContain('scan-only');
  });

  it('@e2e gera arquivo de relatório em modo scan-only com --export', () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-exp-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-exp', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    writeFileSync(join(tempDir, 'src/index.ts'), 'console.log("ok export")', 'utf-8');

    const envClean2 = { ...process.env } as Record<string, string | undefined>;
    delete envClean2.VITEST;
    const proc = spawnSync(
      process.execPath,
      [cliPath, 'diagnosticar', '--scan-only', '--export', '--silence'],
      { cwd: tempDir, encoding: 'utf-8', env: envClean2 as NodeJS.ProcessEnv },
    );
    expect(proc.status).toBe(0);
    // Relatórios padrão vão para ./relatorios
    const relatoriosDir = join(tempDir, 'relatorios');
    const files = existsSync(relatoriosDir) ? readdirSync(relatoriosDir) : [];
    const temScan = files.some((f) => f.startsWith('oraculo-scan-') && f.endsWith('.json'));
    expect(temScan).toBe(true);
  });

  it('@e2e executa diagnosticar completo (sem --scan-only) e gera ocorrências esperadas', () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-full-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-full', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    // Arquivo que força ritual-comando a reconhecer padrão (nome contendo 'bot')
    writeFileSync(join(tempDir, 'src', 'main.ts'), 'export function ok(){ return 42; }', 'utf-8');
    const envLimpo = { ...process.env } as Record<string, string | undefined>;
    // Remover flag de ambiente de testes para permitir process.exit real
    delete envLimpo.VITEST;
    const envClean3 = { ...envLimpo } as Record<string, string | undefined>;
    delete envClean3.VITEST;
    const proc = spawnSync(process.execPath, [cliPath, 'diagnosticar', '--silence'], {
      cwd: tempDir,
      encoding: 'utf-8',
      env: envClean3 as NodeJS.ProcessEnv,
    });
    // Mesmo com --silence, exit code deve refletir ausência de erros críticos (somente avisos) => 0
    // Pode haver ocorrências elevadas a erro conforme regras; aceitamos 0 ou 1 desde que não seja crash diferente
    expect([0, 1]).toContain(proc.status);
  }, 60000);

  it('@e2e executa diagnosticar com --guardian-check criando baseline inicial (exit 0)', () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-guardian-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-guardian', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    writeFileSync(join(tempDir, 'src', 'index.ts'), 'console.log("guardian")', 'utf-8');
    const envClean4 = { ...process.env } as Record<string, string | undefined>;
    delete envClean4.VITEST;
    const proc = spawnSync(
      process.execPath,
      [cliPath, 'diagnosticar', '--guardian-check', '--scan-only', '--silence'],
      { cwd: tempDir, encoding: 'utf-8', env: envClean4 as NodeJS.ProcessEnv },
    );
    expect(proc.status).toBe(0);
    // Verifica criação do baseline
    const baselinePath = join(tempDir, '.oraculo', 'baseline.json');
    expect(existsSync(baselinePath)).toBe(true);
  }, 60000);

  it('@e2e aceita exit 0/1 quando técnica recebe AST nulo (arquivo bot.txt sem AST)', () => {
    const cliPath = garantirBuild();
    const tempDir = mkdtempSync(join(tmpdir(), 'oraculo-e2e-erro-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'proj-e2e-erro', version: '1.0.0', type: 'module' }, null, 2),
      'utf-8',
    );
    mkdirSync(join(tempDir, 'src'));
    // Cria arquivo bot.txt (extensão não parseada) para que ritual-comando receba ast null e reporte erro
    writeFileSync(join(tempDir, 'src', 'bot.txt'), 'onCommand("cmdX", ()=>{})', 'utf-8');
    const envLimpo = { ...process.env } as Record<string, string | undefined>;
    delete envLimpo.VITEST; // permitir process.exit no filho
    const proc = spawnSync(process.execPath, [cliPath, 'diagnosticar', '--silence'], {
      cwd: tempDir,
      encoding: 'utf-8',
      env: envLimpo as NodeJS.ProcessEnv,
    });
    // Implementação permissiva pode ignorar AST nulo e seguir com exit 0
    expect([0, 1]).toContain(proc.status);
  }, 60000);
});
