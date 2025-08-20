// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

const fakeDirent = (name: string, isDir = false) => ({
  name,
  isDirectory: () => isDir,
  isSymbolicLink: () => false,
});

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

describe('scanner — branches: erros de stat e stat indefinido', () => {
  it('quando fs.stat lança erro para arquivo, registra onProgress erro "ler" e não inclui', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({ default: { isMatch: () => false }, isMatch: () => false }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('a.ts')];
      return [];
    });
    (promises.stat as any).mockRejectedValue(new Error('stat-falhou'));

    const logs: string[] = [];
    const res = await scanRepository('/base', { onProgress: (m) => logs.push(String(m)) });
    expect(Object.keys(res)).toEqual([]);
    // Deve logar erro de leitura para a.ts
    const temErro = logs.some(
      (m) =>
        m.includes('"tipo":"erro"') && m.includes('"acao":"ler"') && m.includes('"caminho":"a.ts"'),
    );
    expect(temErro).toBe(true);
  });

  it('quando stat retorna null/undefined, lança e captura no catch externo (mensagem erro ler)', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({ default: { isMatch: () => false }, isMatch: () => false }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('a.ts')];
      return [];
    });
    // Retorna undefined para cobrir o ramo "stat == null" e o throw subsequente
    (promises.stat as any).mockResolvedValue(undefined);

    const logs: string[] = [];
    const res = await scanRepository('/base', { onProgress: (m) => logs.push(String(m)) });
    expect(Object.keys(res)).toEqual([]);
    const temErro = logs.some(
      (m) =>
        m.includes('"tipo":"erro"') && m.includes('"acao":"ler"') && m.includes('"caminho":"a.ts"'),
    );
    expect(temErro).toBe(true);
  });

  it('quando fs.stat rejeita com string, usa fallback String(e) no log de erro', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({ default: { isMatch: () => false }, isMatch: () => false }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') return [fakeDirent('a.ts')];
      return [];
    });
    (promises.stat as any).mockRejectedValue('falhou');

    const logs: string[] = [];
    const res = await scanRepository('/base', { onProgress: (m) => logs.push(String(m)) });
    expect(Object.keys(res)).toEqual([]);
    const temErro = logs.some(
      (m) =>
        m.includes('"tipo":"erro"') &&
        m.includes('"acao":"ler"') &&
        m.includes('"caminho":"a.ts"') &&
        m.includes('falhou'),
    );
    expect(temErro).toBe(true);
  });

  it('quando fs.readdir rejeita com string, usa fallback String(err) no log de erro acessar', async () => {
    vi.resetModules();
    vi.doMock('micromatch', () => ({ default: { isMatch: () => false }, isMatch: () => false }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: [],
        REPORT_SILENCE_LOGS: true,
      },
    }));

    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');

    (promises.readdir as any).mockImplementation(async (p: string) => {
      const n = p.replace(/\\/g, '/');
      if (n === '/base') throw 'sem-permissao';
      return [];
    });

    const logs: string[] = [];
    const res = await scanRepository('/base', { onProgress: (m) => logs.push(String(m)) });
    expect(Object.keys(res)).toEqual([]);
    const temErro = logs.some(
      (m) =>
        m.includes('"tipo":"erro"') &&
        m.includes('"acao":"acessar"') &&
        m.includes('"caminho":"/base"') &&
        m.includes('sem-permissao'),
    );
    expect(temErro).toBe(true);
  });
});
