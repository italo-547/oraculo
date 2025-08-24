// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

const fakeDirent = (name: string, isDir = false) => ({
  name,
  isDirectory: () => isDir,
  isSymbolicLink: () => false,
});

// Mocks padrão por arquivo; cada teste pode sobrescrever com vi.doMock + vi.resetModules
vi.mock('node:fs', () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));
vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn(async (file: string) => 'conteudo_' + file),
  lerArquivoTexto: vi.fn(async (file: string) => 'texto_' + file),
}));

describe('scanner — branches adicionais', () => {
  it('CLI_INCLUDE_GROUPS: AND dentro de grupo e OR entre grupos', async () => {
    vi.resetModules();
    // micromatch mínimo: suporta 'dir/**', 'other/**' e '*.ts'
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, pat: string | string[]) => {
          const patterns = Array.isArray(pat) ? pat : [pat];
          return patterns.some((p) =>
            p === '*.ts'
              ? str.endsWith('.ts')
              : p === 'dir/**'
                ? str.startsWith('dir/')
                : p === 'other/**'
                  ? str.startsWith('other/')
                  : false,
          );
        },
      },
      isMatch: (str: string, p: string | string[]) => {
        const patterns = Array.isArray(p) ? p : [p];
        return patterns.some((pp) =>
          pp === '*.ts'
            ? str.endsWith('.ts')
            : pp === 'dir/**'
              ? str.startsWith('dir/')
              : pp === 'other/**'
                ? str.startsWith('other/')
                : false,
        );
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_INCLUDE_GROUPS: [['dir/**', '*.ts'], ['other/**']],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));

    const { scanRepository } = await import('../../src/nucleo/scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('dir', true), fakeDirent('other', true)];
      if (n === '/base/dir') return [fakeDirent('a.ts'), fakeDirent('b.js')];
      if (n === '/base/other') return [fakeDirent('c.ts')];
      return [];
    });
    (promises.stat as any).mockResolvedValue({
      mtimeMs: 1,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    });

    const res = await scanRepository('/base');
    const keys = Object.keys(res)
      .map((k) => k.replace(/\\/g, '/'))
      .sort();
    expect(keys).toEqual(['dir/a.ts', 'other/c.ts']); // dir/b.js filtrado pelo '*.ts'
  });

  it('hasInclude com padrões sem root derivado: escaneia baseDir e retorna', async () => {
    vi.resetModules();
    // micromatch: igualdade simples
    vi.doMock('micromatch', () => ({
      default: { isMatch: (str: string, patterns: string[]) => patterns?.includes(str) },
      isMatch: (str: string, patterns: string[]) => patterns?.includes(str),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['a.txt'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('../../src/nucleo/scanner.js');
    const { promises } = await import('node:fs');

    const calls: string[] = [];
    (promises.readdir as any).mockImplementation(async (p: string) => {
      calls.push(p);
      if (p === '/base') return [fakeDirent('a.txt'), fakeDirent('b.txt')];
      return [];
    });
    (promises.stat as any).mockResolvedValue({
      mtimeMs: 1,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    });

    const res = await scanRepository('/base');
    expect(Object.keys(res)).toEqual(['a.txt']);
    // Garantia: com startDirs vazio + hasInclude, varreu só a raiz e retornou
    expect(calls).toEqual(['/base']);
  });

  it('node_modules: sem include explícito não desce; com include desce', async () => {
    // Caso 1: sem include explícito
    {
      vi.resetModules();
      vi.doMock('micromatch', () => ({
        default: { isMatch: (str: string, patterns: string[]) => patterns?.includes(str) },
        isMatch: (str: string, patterns: string[]) => patterns?.includes(str),
      }));
      vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
        config: { ZELADOR_IGNORE_PATTERNS: [], CLI_INCLUDE_PATTERNS: [], CLI_EXCLUDE_PATTERNS: [] },
      }));
      const { scanRepository } = await import('../../src/nucleo/scanner.js');
      const { promises } = await import('node:fs');
      const calls: string[] = [];
      (promises.readdir as any).mockImplementation(async (p: string) => {
        const n = p.replace(/\\/g, '/');
        calls.push(n);
        if (n === '/base') return [fakeDirent('node_modules', true), fakeDirent('src', true)];
        if (n === '/base/src') return [fakeDirent('a.ts')];
        if (n === '/base/node_modules') return [fakeDirent('pkg.js')];
        return [];
      });
      (promises.stat as any).mockResolvedValue({
        mtimeMs: 1,
        isDirectory: () => false,
        isSymbolicLink: () => false,
      });
      const res = await scanRepository('/base');
      const keys = Object.keys(res)
        .map((k) => k.replace(/\\/g, '/'))
        .sort();
      expect(keys).toEqual(['src/a.ts']);
      expect(calls.includes('/base/node_modules')).toBe(false);
      expect(calls.includes('/base/src')).toBe(true);
    }
    // Caso 2: include explícito em node_modules/** deve descer
    {
      vi.resetModules();
      vi.doMock('micromatch', () => ({
        default: {
          isMatch: (str: string, patterns: string[]) =>
            patterns?.some((p) =>
              p === 'node_modules/**'
                ? str.startsWith('node_modules/')
                : p === 'pkg.js'
                  ? str.endsWith('pkg.js')
                  : false,
            ),
        },
        isMatch: (str: string, patterns: string[]) =>
          patterns?.some((p) =>
            p === 'node_modules/**'
              ? str.startsWith('node_modules/')
              : p === 'pkg.js'
                ? str.endsWith('pkg.js')
                : false,
          ),
      }));
      vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
        config: {
          ZELADOR_IGNORE_PATTERNS: [],
          CLI_INCLUDE_PATTERNS: ['node_modules/**', 'pkg.js'],
          CLI_EXCLUDE_PATTERNS: [],
        },
      }));
      const { scanRepository } = await import('../../src/nucleo/scanner.js');
      const { promises } = await import('node:fs');
      const calls: string[] = [];
      (promises.readdir as any).mockImplementation(async (p: string) => {
        const n = p.replace(/\\/g, '/');
        calls.push(n);
        if (n === '/base/node_modules') return [fakeDirent('pkg.js')];
        if (n === '/base') return [fakeDirent('node_modules', true)];
        return [];
      });
      (promises.stat as any).mockResolvedValue({
        mtimeMs: 2,
        isDirectory: () => false,
        isSymbolicLink: () => false,
      });
      const res = await scanRepository('/base');
      const keys = Object.keys(res)
        .map((k) => k.replace(/\\/g, '/'))
        .sort();
      expect(keys).toEqual(['node_modules/pkg.js']);
      expect(calls.includes('/base/node_modules')).toBe(true);
    }
  });

  it('REPORT_SILENCE_LOGS true evita log de sucesso por arquivo', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: { isMatch: () => false },
      isMatch: () => false,
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
      },
    }));
    const { scanRepository } = await import('../../src/nucleo/scanner.js');
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
    (promises.stat as any).mockResolvedValueOnce({
      mtimeMs: 5,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    });
    const onProgress = vi.fn();
    await scanRepository('/base', { onProgress });
    const msgs = onProgress.mock.calls.flat().map(String);
    expect(msgs.some((m) => m.includes('✅ Arquivo lido: a.txt'))).toBe(false);
  });

  it('root derivado tratado como arquivo quando readdir falha e stat não é diretório', async () => {
    vi.resetModules();
    // micromatch com fallback de '/**' por prefixo (como implementado no scanner)
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, patterns: string[]) =>
          patterns?.some((p) => (p === 'dir/**' ? str.startsWith('dir/') : false)),
      },
      isMatch: (str: string, patterns: string[]) =>
        patterns?.some((p) => (p === 'dir/**' ? str.startsWith('dir/') : false)),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['dir/**'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('../../src/nucleo/scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      if (p === '/base/dir') throw new Error('not a dir');
      return [];
    });
    (promises.stat as any).mockImplementation(async (p: string) => ({
      mtimeMs: 9,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    }));

    const res = await scanRepository('/base');
    // Como tratou '/base/dir' como arquivo, a chave resultante é 'dir'
    expect(Object.keys(res)).toEqual(['dir']);
    expect(res['dir'].content?.replace(/\\/g, '/')).toBe('conteudo_/base/dir');
  });
});
