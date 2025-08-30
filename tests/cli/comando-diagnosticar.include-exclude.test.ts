// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Usaremos o iniciarInquisicao real (scanner) + prepararComAst real, mas mockamos executarInquisicao
// para capturar os fileEntries já filtrados após include/exclude.

const originalCwd = process.cwd();
let TMP_DIR = '';

async function setupTmp(files: Record<string, string>) {
  // Cria diretório temporário único por teste
  TMP_DIR = path.join(
    originalCwd,
    'tmp-oraculo-filtros-test-' + Math.random().toString(36).slice(2),
  );
  await fs.mkdir(TMP_DIR, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(TMP_DIR, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, 'utf-8');
  }
  process.chdir(TMP_DIR);
  return TMP_DIR;
}

afterAll(async () => {
  // Restaura cwd e remove diretório temporário único
  process.chdir(originalCwd);
  await new Promise((r) => setTimeout(r, 200));
  if (TMP_DIR) {
    try {
      await fs.rm(TMP_DIR, { recursive: true, force: true });
    } catch (err: any) {
      if (err.code !== 'ENOTEMPTY' && err.code !== 'ENOENT') throw err;
      // Se ainda restar ENOTEMPTY, ignora pois não afeta ciclo dos testes
    }
  }
});

beforeEach(async () => {
  vi.resetModules();
  // Garante restauração de CWD antes de recriar
  process.chdir(originalCwd);
});

describe('comando-diagnosticar filtros include/exclude', () => {
  it('--include (múltiplas ocorrências e vírgulas) restringe arquivos e sobrepõe ignores padrão (ex: node_modules)', async () => {
    await setupTmp({
      'src/a.ts': 'console.log("a")',
      'node_modules/lib/index.js': 'console.log("lib")',
      'outro/b.ts': 'console.log("b")',
    });

    // Importações após estrutura criada
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const inquisidor = await import('../../src/nucleo/inquisidor.js');
    const executarInqSpy = vi
      .spyOn(inquisidor, 'executarInquisicao')
      .mockImplementation(async (_fileEntries, tecnicas, baseDir, guardianResultado, opts) => {
        return { ocorrencias: [], fileEntries: _fileEntries } as any;
      });

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));
    await program.parseAsync([
      'node',
      'cli',
      'diagnosticar',
      '--include',
      'node_modules/**',
      '--include',
      'src/**/*.ts,src/**/*.tsx',
    ]);

    const chamada = executarInqSpy.mock.calls.at(-1);
    expect(chamada).toBeTruthy();
    const fileEntries = chamada?.[0] || [];
    // Deve conter somente arquivo dentro de node_modules
    const rels = fileEntries.map((f: any) => f.relPath.replace(/\\/g, '/')).sort();
    // O include prioriza apenas patterns que batem – sem src/ presentes, apenas node_modules
    expect(rels).toEqual(['node_modules/lib/index.js']);
  }, 30000);

  it('--exclude (repetido e com espaços) remove padrões após include vazio (comportamento normal)', async () => {
    await setupTmp({
      'src/a.ts': 'console.log("a")',
      'src/b.ts': 'console.log("b")',
      'test/c.test.ts': 'console.log("c")',
    });
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const inquisidor = await import('../../src/nucleo/inquisidor.js');
    const executarInqSpy = vi
      .spyOn(inquisidor, 'executarInquisicao')
      .mockImplementation(async (_fileEntries) => {
        return { ocorrencias: [], fileEntries: _fileEntries } as any;
      });
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));
    await program.parseAsync([
      'node',
      'cli',
      'diagnosticar',
      '--exclude',
      'test/**',
      '--exclude',
      '  docs/**  ',
    ]);
    const fileEntries = executarInqSpy.mock.calls.at(-1)?.[0] || [];
    const rels = fileEntries.map((f: any) => f.relPath.replace(/\\/g, '/')).sort();
    expect(rels).not.toContain('test/c.test.ts');
    expect(rels).toContain('src/a.ts');
  }, 30000);
});
