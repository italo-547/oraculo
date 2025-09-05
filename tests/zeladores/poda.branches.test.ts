// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('../../src/zeladores/fantasma.js', () => ({
  detectarFantasmas: vi.fn(async () => ({ fantasmas: [] })),
}));
vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn(async () => []),
  salvarEstado: vi.fn(async () => undefined),
}));
vi.mock('../../src/relatorios/relatorio-poda.js', () => ({
  gerarRelatorioPodaMarkdown: vi.fn(async () => undefined),
  gerarRelatorioPodaJson: vi.fn(async () => undefined),
}));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
  config: {
    AUTOANALISE_CONCURRENCY: 2,
    ZELADOR_ABANDONED_DIR: '.abandonados',
    ZELADOR_PENDING_PATH: 'pend.json',
    ZELADOR_REACTIVATE_PATH: 'reativar.json',
    ZELADOR_HISTORY_PATH: 'hist.json',
    ZELADOR_REPORT_PATH: 'poda.json',
  },
}));

describe('poda branches', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it('executarPodaCiclica caminho sem arquivos a podar (gera relatório e retorna)', async () => {
    const { executarPodaCiclica } = await import('../../src/zeladores/poda.js');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    await executarPodaCiclica(false);
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Nenhum arquivo'));
  });

  it('executarPodaCiclica com arquivos a podar (simulação)', async () => {
    vi.doMock('./fantasma.js', () => ({
      detectarFantasmas: vi.fn(async () => ({
        fantasmas: [{ arquivo: 'a.ts' }, { arquivo: 'b.ts', referenciado: true }],
      })),
    }));
    const { executarPodaCiclica } = await import('../../src/zeladores/poda.js');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    await executarPodaCiclica(false);
    // espera logs de SIMULADO nas movimentações
    const chamadasInfo = (log.info as any).mock.calls.flat().join('\n');
    expect(chamadasInfo).toMatch(/SIMULADO/);
  });
});
