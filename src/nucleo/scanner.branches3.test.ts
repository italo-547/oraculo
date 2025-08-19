// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

const fakeDirent = (name: string, isDir = false) => ({
  name,
  isDirectory: () => isDir,
  isSymbolicLink: () => false,
});

// Mocks base por arquivo; cada teste pode ajustar com vi.doMock + vi.resetModules
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

describe('scanner — branches extras 2', () => {
  it("calcularIncludeRoots: padrão 'abc/*' gera anchor 'abc' e inclui arquivo", async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, pat: string | string[]) => {
          const patterns = Array.isArray(pat) ? pat : [pat];
          return patterns.some((p) => (p === 'abc/*' ? str.startsWith('abc/') : false));
        },
      },
      isMatch: (str: string, pat: string | string[]) => {
        const patterns = Array.isArray(pat) ? pat : [pat];
        return patterns.some((p) => (p === 'abc/*' ? str.startsWith('abc/') : false));
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['abc/*'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('abc', true)];
      if (n === '/base/abc') return [fakeDirent('a.txt')];
      return [];
    });
    (promises.stat as any).mockResolvedValue({ mtimeMs: 3, isDirectory: () => false });

    const res = await scanRepository('/base');
    expect(Object.keys(res).map((k) => k.replace(/\\/g, '/'))).toEqual(['abc/a.txt']);
  });

  it("calcularIncludeRoots: padrão 'dir/file.txt' gera anchor 'dir' e inclui apenas o arquivo", async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, pat: string | string[]) => {
          const patterns = Array.isArray(pat) ? pat : [pat];
          return patterns.some((p) => (p === 'dir/file.txt' ? str === 'dir/file.txt' : false));
        },
      },
      isMatch: (str: string, pat: string | string[]) => {
        const patterns = Array.isArray(pat) ? pat : [pat];
        return patterns.some((p) => (p === 'dir/file.txt' ? str === 'dir/file.txt' : false));
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['dir/file.txt'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('dir', true)];
      if (n === '/base/dir') return [fakeDirent('file.txt')];
      return [];
    });
    (promises.stat as any).mockResolvedValue({ mtimeMs: 4, isDirectory: () => false });

    const res = await scanRepository('/base');
    expect(Object.keys(res).map((k) => k.replace(/\\/g, '/'))).toEqual(['dir/file.txt']);
  });

  it('candidatos vazios em grupos (CLI_INCLUDE_GROUPS: [[]]) dispara startDirs vazio e scan(baseDir) mas não inclui arquivos', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: { isMatch: () => true }, // grupo vazio faz every([]) === true; qualquer arquivo passa
      isMatch: () => true,
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_GROUPS: [[]],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    const calls: string[] = [];
    (promises.readdir as any).mockImplementation(async (p: string) => {
      calls.push(p);
      if (p === '/base') return [fakeDirent('a.txt')];
      return [];
    });
    (promises.stat as any).mockResolvedValue({ mtimeMs: 7, isDirectory: () => false });

    const res = await scanRepository('/base');
    // Com grupo vazio, o matcher de includes não seleciona nenhum arquivo,
    // mas o scanner ainda tenta varrer o diretório base.
    expect(Object.keys(res)).toEqual([]);
    expect(calls).toEqual(['/base']);
  });

  it('root tratado como diretório via fallback: stat sem isDirectory + readdir bem-sucedido', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (s: string, p: string | string[]) =>
          (Array.isArray(p) ? p : [p]).some((pp) =>
            pp === 'abc/**' ? s.startsWith('abc/') : false,
          ),
      },
      isMatch: (s: string, p: string | string[]) =>
        (Array.isArray(p) ? p : [p]).some((pp) => (pp === 'abc/**' ? s.startsWith('abc/') : false)),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['abc/**'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    // Primeiro readdir do startDir falha, forçando fluxo de arquivo
    (promises.readdir as any).mockImplementationOnce(async () => {
      throw new Error('not dir');
    });
    // stat sem isDirectory e mtimeMs presente
    (promises.stat as any).mockResolvedValueOnce({ mtimeMs: 11 });
    // Fallback readdir (para decidir que é dir) agora funciona e depois lista conteúdo
    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base/abc') return [fakeDirent('x.txt')];
      if (n === '/base') return [fakeDirent('abc', true)];
      return [];
    });

    const res = await scanRepository('/base');
    expect(Object.keys(res).map((k) => k.replace(/\\/g, '/'))).toEqual(['abc/x.txt']);
  });

  it('mtimeMs 0 ativa fallback Date.now() na escrita de arquivo (root como arquivo)', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (s: string, p: string | string[]) =>
          (Array.isArray(p) ? p : [p]).some((pp) =>
            pp === 'abc/**' ? s.startsWith('abc/') : false,
          ),
      },
      isMatch: (s: string, p: string | string[]) =>
        (Array.isArray(p) ? p : [p]).some((pp) => (pp === 'abc/**' ? s.startsWith('abc/') : false)),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['abc/**'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    // Falha ao tratar como diretório em ambas tentativas, vira arquivo
    (promises.readdir as any).mockImplementation(async () => {
      throw new Error('not dir');
    });
    (promises.stat as any).mockResolvedValue({ mtimeMs: 0 });

    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    const res = await scanRepository('/base');
    const entry = res['abc'] || res['abc'.replace(/\\/g, '/')];
    expect(entry).toBeTruthy();
    expect(entry.ultimaModificacao).toBe(1234567890);
    nowSpy.mockRestore();
  });

  it('scan(dir) captura erro inicial de readdir e loga via onProgress', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({ default: { isMatch: () => false }, isMatch: () => false }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: { ZELADOR_IGNORE_PATTERNS: [], CLI_INCLUDE_PATTERNS: [], CLI_EXCLUDE_PATTERNS: [] },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockRejectedValue(new Error('denied'));
    const onProgress = vi.fn();
    const res = await scanRepository('/base', { onProgress });
    expect(Object.keys(res)).toEqual([]);
    const msgs = onProgress.mock.calls.flat().map((c) => String(c));
    expect(
      msgs.some((m) => m.includes('\"acao\":\"acessar\"') && m.includes('\"caminho\":\"/base\"')),
    ).toBe(true);
  });

  it('catch final no loop de roots: stat falha e erro é reportado', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (s: string, p: string | string[]) =>
          (Array.isArray(p) ? p : [p]).some((pp) =>
            pp === 'abc/**' ? s.startsWith('abc/') : false,
          ),
      },
      isMatch: (s: string, p: string | string[]) =>
        (Array.isArray(p) ? p : [p]).some((pp) => (pp === 'abc/**' ? s.startsWith('abc/') : false)),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['abc/**'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    // Primeira tentativa: readdir falha para entrar no fluxo de arquivo
    (promises.readdir as any).mockRejectedValueOnce(new Error('no dir'));
    // Segunda: stat falha provocando catch externo
    (promises.stat as any).mockRejectedValueOnce(new Error('stat failed'));

    const onProgress = vi.fn();
    await scanRepository('/base', { onProgress });
    const msgs = onProgress.mock.calls.flat().map((c) => String(c));
    // Deve registrar erro com acao acessar para o caminho normalizado
    expect(
      msgs.some(
        (m) => m.includes('\"acao\":\"acessar\"') && m.includes('\"caminho\":\"/base/abc\"'),
      ),
    ).toBe(true);
  });
});
