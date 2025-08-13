import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('./util/persistencia.js', () => ({
  lerEstado: vi.fn(async () => []),
  salvarEstado: vi.fn(async () => undefined),
}));
vi.mock('../relatorios/relatorio-poda.js', () => ({
  gerarRelatorioPodaMarkdown: vi.fn(async () => undefined),
  gerarRelatorioPodaJson: vi.fn(async () => undefined),
}));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({
  config: {
    AUTOANALISE_CONCURRENCY: 2,
    ZELADOR_ABANDONED_DIR: '.abandonados',
    ZELADOR_PENDING_PATH: 'pend.json',
    ZELADOR_REACTIVATE_PATH: 'reativar.json',
    ZELADOR_HISTORY_PATH: 'hist.json',
    ZELADOR_REPORT_PATH: 'poda.json',
  },
}));

describe('poda execução real branches', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('executarPodaCiclica(true) cobre moverArquivos sucesso e erro', async () => {
    vi.doMock('./fantasma.js', () => ({
      detectarFantasmas: vi.fn(async () => ({
        fantasmas: [{ arquivo: 'a.ts' }, { arquivo: 'b.ts' }],
      })),
    }));
    vi.doMock('node:fs', () => ({
      promises: {
        mkdir: vi.fn(async () => undefined),
        rename: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('rename fail')),
      },
    }));
    const { executarPodaCiclica } = await import('./poda.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    await executarPodaCiclica(true);
    const avisos = (log.aviso as any).mock.calls.flat().join('\n');
    expect(avisos).toMatch(/Podando 2 arquivos/);
    const sucessos = (log.sucesso as any).mock.calls.flat().join('\n');
    expect(sucessos).toMatch(/movido para abandonados/);
    const erros = (log.erro as any).mock.calls.flat().join('\n');
    expect(erros).toMatch(/Falha ao mover b.ts/);
  });
});
