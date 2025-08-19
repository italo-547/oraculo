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
vi.mock('../zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn(async (file: string) => 'conteudo_' + file),
  lerArquivoTexto: vi.fn(async (file: string) => 'texto_' + file),
}));

describe('scanner — exclude de diretório impede descida (branches)', () => {
  it('exclui diretório via CLI_EXCLUDE_PATTERNS e não desce nele', async () => {
    vi.resetModules();
    // micromatch simples: suporta padrões de prefixo 'dir/**' e seleção por sufixo de .ts
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, patterns: string | string[]) => {
          const pats = Array.isArray(patterns) ? patterns : [patterns];
          return pats.some((p) => {
            if (p === 'dir' || p === 'dir/') return str === 'dir' || str.startsWith('dir/');
            if (p === 'dir/**') return str.startsWith('dir/');
            if (p === '*.ts') return str.endsWith('.ts');
            return false;
          });
        },
      },
      isMatch: (str: string, patterns: string | string[]) => {
        const pats = Array.isArray(patterns) ? patterns : [patterns];
        return pats.some((p) => {
          if (p === 'dir' || p === 'dir/') return str === 'dir' || str.startsWith('dir/');
          if (p === 'dir/**') return str.startsWith('dir/');
          if (p === '*.ts') return str.endsWith('.ts');
          return false;
        });
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        // Inclui 'dir' para impedir descida e 'dir/**' para excluir filhos
        CLI_EXCLUDE_PATTERNS: ['dir', 'dir/**'],
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    const calls: string[] = [];
    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      calls.push(n);
      if (n === '/base') return [fakeDirent('dir', true), fakeDirent('keep', true)];
      if (n === '/base/dir') return [fakeDirent('a.ts')];
      if (n === '/base/keep') return [fakeDirent('b.ts')];
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
    expect(keys).toEqual(['keep/b.ts']);
    // Garante que não houve descida em /base/dir devido ao exclude
    expect(calls.includes('/base/dir')).toBe(false);
    expect(calls.includes('/base/keep')).toBe(true);
  });
});
