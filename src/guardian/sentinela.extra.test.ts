import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

// Testes extras para cobrir caminhos não exercitados: options.justDiff sem erros, baseline anterior vazio vs snapshot igual (ok), construção ignora conteúdos vazios

describe('sentinela (extra)', () => {
  it('justDiff sem erros retorna ok quando não há diffs', async () => {
    vi.doMock('node:fs', () => ({ promises: { mkdir: vi.fn().mockResolvedValue(undefined) } }));
    // Não mockamos 'path' para evitar quebrar path.join
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: { info: vi.fn(), aviso: vi.fn() } }));
    vi.doMock('./hash.js', () => ({ gerarSnapshotDoConteudo: vi.fn((c: string) => 'h_' + c) }));
    vi.doMock('./baseline.js', () => ({
      carregarBaseline: vi.fn(async () => ({ a: 'h_a' })),
      salvarBaseline: vi.fn(),
    }));
    vi.doMock('./diff.js', () => ({
      diffSnapshots: vi.fn(() => ({ removidos: [], adicionados: [], alterados: [] })),
      verificarErros: vi.fn(() => []),
    }));
    vi.doMock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/base.json' }));
    vi.doMock('../tipos/tipos.js', async () => ({
      IntegridadeStatus: {
        Ok: 'ok',
        Criado: 'criado',
        Aceito: 'aceito',
        AlteracoesDetectadas: 'alt',
      },
      GuardianError: class extends Error {},
    }));
    const { scanSystemIntegrity } = await import('./sentinela.js');
    const res = await scanSystemIntegrity([{ relPath: 'a', content: 'a', fullPath: '' }], {
      justDiff: true,
    });
    expect(res.status).toBe('ok');
  });

  it('acceptNewBaseline salva snapshot construído ignorando vazios', async () => {
    vi.doMock('node:fs', () => ({ promises: { mkdir: vi.fn().mockResolvedValue(undefined) } }));
    // Não mockamos 'path' para evitar quebrar path.join
    const salvarBaseline = vi.fn();
    vi.doMock('./baseline.js', () => ({ carregarBaseline: vi.fn(), salvarBaseline }));
    const gerarSnapshotDoConteudo = vi.fn((c: string) => 'h_' + c);
    vi.doMock('./hash.js', () => ({ gerarSnapshotDoConteudo }));
    vi.doMock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/base.json' }));
    const { acceptNewBaseline } = await import('./sentinela.js');
    await acceptNewBaseline([
      { relPath: 'a', content: 'aaa', fullPath: '' },
      { relPath: 'b', content: '   ', fullPath: '' }, // deve ser ignorado
    ] as any);
    expect(gerarSnapshotDoConteudo).toHaveBeenCalledTimes(1);
    expect(salvarBaseline).toHaveBeenCalled();
  });
});
