// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

const fakeDirent = (name: string, isDir = false) => ({
  name,
  isDirectory: () => isDir,
  isSymbolicLink: () => false,
});

describe('scanner — fallback de prefixo para padrões com sufixo "/**"', () => {
  it('inclui arquivos via fallback quando micromatch falha no OR de lista', async () => {
    vi.resetModules();
    // Força micromatch a não casar quando recebe lista ['src/**'] para exercitar o fallback de prefixo
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, pat: string | string[]) => {
          if (Array.isArray(pat) && pat.length === 1 && pat[0] === 'src/**') return false;
          return false;
        },
      },
      isMatch: (str: string, pat: string | string[]) => {
        if (Array.isArray(pat) && pat.length === 1 && pat[0] === 'src/**') return false;
        return false;
      },
    }));
    // Mock de fs.promises com funções espiáveis
    vi.mock('node:fs', () => ({
      promises: {
        readdir: vi.fn(),
        stat: vi.fn(),
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['src/**'],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
        SCAN_ONLY: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('src', true)];
      if (n === '/base/src') return [fakeDirent('app', true)];
      if (n === '/base/src/app') return [fakeDirent('index.ts')];
      return [];
    });
    (promises.stat as any).mockResolvedValue({
      mtimeMs: 1,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    });

    const res = await (await import('./scanner.js')).scanRepository('/base');
    const keys = Object.keys(res)
      .map((k) => k.replace(/\\/g, '/'))
      .sort();
    expect(keys).toEqual(['src/app/index.ts']);
    expect(res['src/app/index.ts'].content).toBeNull();
  });
});
