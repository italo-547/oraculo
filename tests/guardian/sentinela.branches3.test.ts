// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({ promises: { mkdir: vi.fn(async () => undefined) } }));
vi.mock('../../src/guardian/hash.js', () => ({
  gerarSnapshotDoConteudo: vi.fn((c: string) => 'h' + c),
}));
vi.mock('../../src/guardian/baseline.js', () => ({
  carregarBaseline: vi.fn(),
  salvarBaseline: vi.fn(),
}));
vi.mock('../../src/guardian/diff.js', () => ({
  diffSnapshots: vi.fn(() => []),
  verificarErros: vi.fn(() => []),
}));
vi.mock('../../src/guardian/constantes.js', () => ({ BASELINE_PATH: '/tmp/b-dev.json' }));
vi.mock('../../src/tipos/tipos.js', async () => {
  const mod = await import('../../src/tipos/tipos.js');
  return {
    ...mod,
    IntegridadeStatus: {
      Ok: 'ok',
      Criado: 'criado',
      Aceito: 'aceito',
      AlteracoesDetectadas: 'alt',
    },
    GuardianError: class extends Error {
      constructor(m: string) {
        super(m);
      }
    },
  };
});

describe('sentinela branches extras (DEV_MODE, justDiff ok, snapshot skip vazio)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('DEV_MODE loga filtro aplicado com padrões de ignore', async () => {
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        GUARDIAN_IGNORE_PATTERNS: ['ignored/**'],
      },
    }));
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    (carregarBaseline as any).mockResolvedValue({});
    const { scanSystemIntegrity } = await import('../../src/guardian/sentinela.js');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    await scanSystemIntegrity([
      { relPath: 'kept/file.ts', content: '1', fullPath: '/x/kept/file.ts' },
      { relPath: 'ignored/file.ts', content: '2', fullPath: '/x/ignored/file.ts' },
    ]);
    const infos = (log.info as any).mock.calls.flat().join('\n');
    expect(infos).toMatch(/Guardian filtro aplicado/);
    expect(infos).toMatch(/removidos 1/);
  });

  it('justDiff sem erros retorna ok', async () => {
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: { DEV_MODE: false } }));
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    (carregarBaseline as any).mockResolvedValue({ a: 'h1' });
    const { scanSystemIntegrity } = await import('../../src/guardian/sentinela.js');
    const r = await scanSystemIntegrity([{ relPath: 'a', content: '1', fullPath: '/a' }], {
      justDiff: true,
    });
    expect(r.status).toBe('ok');
  });

  it('construirSnapshot ignora arquivos com conteúdo vazio', async () => {
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
    const { carregarBaseline, salvarBaseline } = await import('../../src/guardian/baseline.js');
    (carregarBaseline as any).mockResolvedValue(null);
    const { scanSystemIntegrity } = await import('../../src/guardian/sentinela.js');
    await scanSystemIntegrity([
      { relPath: 'a.ts', content: 'abc', fullPath: '/a.ts' },
      { relPath: 'vazio.ts', content: '   ', fullPath: '/vazio.ts' },
    ]);
    const chamada = (salvarBaseline as any).mock.calls[0][0];
    expect(chamada).toHaveProperty('a.ts');
    expect(chamada).not.toHaveProperty('vazio.ts');
  });
});
