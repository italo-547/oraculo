// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

const fakeDirent = (name: string, isDir = false) => ({
  name,
  isDirectory: () => isDir,
  isSymbolicLink: () => false,
});

describe('scanner — normalização e erros sem message (branches)', () => {
  it('normaliza listas com itens undefined e grupos não-array; startDirs derivado varre diretório vazio', async () => {
    vi.resetModules();
    // micromatch não é relevante aqui
    vi.doMock('micromatch', () => ({
      default: { isMatch: () => false },
      isMatch: () => false,
    }));
    // Mock de fs.promises
    vi.mock('node:fs', () => ({
      promises: {
        readdir: vi.fn(async (p: string) => {
          const n = p.replace(/\\/g, '/');
          // O startDir será '/base/dir' (ancora de 'dir/**')
          if (n === '/base/dir') return [];
          // Poderá ser chamado antes de scan(norm)
          if (n === '/base/dir/') return [];
          return [];
        }),
        stat: vi.fn(async () => ({
          mtimeMs: 1,
          isDirectory: () => false,
          isSymbolicLink: () => false,
        })),
      },
    }));
    // Config com valores não-array e undefined para cobrir ramos de normalização (String(p || ''))
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [undefined],
        CLI_INCLUDE_PATTERNS: ['dir/**'],
        CLI_INCLUDE_GROUPS: 'nao-array',
        CLI_EXCLUDE_PATTERNS: [undefined],
        REPORT_SILENCE_LOGS: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const res = await scanRepository('/base');
    expect(Object.keys(res)).toEqual([]); // diretório vazio
  });

  it('erro de leitura com exceção sem message (string) usa String(e) no onProgress', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({
      default: { isMatch: () => false },
      isMatch: () => false,
    }));
    vi.mock('node:fs', () => ({
      promises: {
        readdir: vi.fn(async (p: string) => {
          const n = p.replace(/\\/g, '/');
          if (n === '/base') return [fakeDirent('a.txt')];
          return [];
        }),
        stat: vi.fn(async () => ({
          mtimeMs: 2,
          isDirectory: () => false,
          isSymbolicLink: () => false,
        })),
      },
    }));
    // Força lerEstado lançar uma string para cair no ramo String(e)
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      lerEstado: vi.fn(async () => {
        throw 'falha-ler';
      }),
      lerArquivoTexto: vi.fn(async () => 'conteudo'),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const onProgress = vi.fn();
    const res = await scanRepository('/base', { onProgress });
    expect(Object.keys(res)).toEqual(['a.txt']);
    expect(res['a.txt']?.content).toBeNull();
    const logs = onProgress.mock.calls.flat().map((c) => String(c));
    expect(
      logs.some((m) => m.includes('\"acao\":\"ler\"') && m.includes('\"mensagem\":\"falha-ler\"')),
    ).toBe(true);
  });
});
