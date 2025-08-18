// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as poda from './poda.js';

vi.mock('./util/persistencia.js', () => ({
  lerEstado: vi.fn(async () => []),
  salvarEstado: vi.fn(async () => undefined),
}));
vi.mock('./fantasma.js', () => ({
  detectarFantasmas: vi.fn(async () => ({
    fantasmas: [{ arquivo: 'a.txt', referenciado: false }],
  })),
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
    erro: vi.fn(),
    aviso: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('../relatorios/relatorio-poda.js', () => ({
  gerarRelatorioPodaMarkdown: vi.fn(async () => undefined),
  gerarRelatorioPodaJson: vi.fn(async () => undefined),
}));
vi.mock('p-limit', () => ({
  default: () => (fn: any) => fn(),
}));

describe('poda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removerArquivosOrfaos retorna fantasmas detectados', async () => {
    const res = await poda.removerArquivosOrfaos([]);
    expect(res).toHaveProperty('arquivosOrfaos');
    expect(res.arquivosOrfaos[0].arquivo).toBe('a.txt');
  });

  it('executarPodaCiclica executa fluxo de simulação', async () => {
    await poda.executarPodaCiclica(false);
    // Espera-se que log.info e log.aviso sejam chamados
    const { log } = await import('../nucleo/constelacao/log.js');
    expect(log.info).toHaveBeenCalled();
    expect(log.aviso).toHaveBeenCalled();
  });

  it('executarPodaCiclica executa fluxo real sem erro', async () => {
    // Mocks para simular arquivos a podar
    const detectarFantasmas = vi.mocked((await import('./fantasma.js')).detectarFantasmas);
    detectarFantasmas.mockResolvedValueOnce({
      total: 1,
      fantasmas: [{ arquivo: 'b.txt', referenciado: false, diasInativo: 0 }],
    });
    const lerEstado = vi.mocked((await import('./util/persistencia.js')).lerEstado);
    lerEstado.mockResolvedValueOnce([]); // anteriores
    lerEstado.mockResolvedValueOnce([]); // reativar
    lerEstado.mockResolvedValueOnce([]); // historico
    // Mock do fs
    vi.mock('node:fs', () => ({
      promises: {
        mkdir: vi.fn(async () => undefined),
        rename: vi.fn(async () => undefined),
      },
    }));
    await poda.executarPodaCiclica(true);
    const { log } = await import('../nucleo/constelacao/log.js');
    expect(log.sucesso).toHaveBeenCalled();
  });

  it('executarPodaCiclica lida com nenhum arquivo para podar', async () => {
    // Mocks para simular nenhum arquivo a podar
    const detectarFantasmas = vi.mocked((await import('./fantasma.js')).detectarFantasmas);
    detectarFantasmas.mockResolvedValueOnce({ total: 0, fantasmas: [] });
    const lerEstado = vi.mocked((await import('./util/persistencia.js')).lerEstado);
    lerEstado.mockResolvedValueOnce([]); // anteriores
    lerEstado.mockResolvedValueOnce([]); // reativar
    lerEstado.mockResolvedValueOnce([]); // historico
    const gerarRelatorioPodaMarkdown = vi.mocked(
      (await import('../relatorios/relatorio-poda.js')).gerarRelatorioPodaMarkdown,
    );
    const gerarRelatorioPodaJson = vi.mocked(
      (await import('../relatorios/relatorio-poda.js')).gerarRelatorioPodaJson,
    );
    await poda.executarPodaCiclica(true);
    expect(gerarRelatorioPodaMarkdown).toHaveBeenCalled();
    expect(gerarRelatorioPodaJson).toHaveBeenCalled();
  });

  it('executarPodaCiclica lida com erro ao mover arquivo', async () => {
    // Mocks para simular erro ao mover arquivo
    const detectarFantasmas = vi.mocked((await import('./fantasma.js')).detectarFantasmas);
    detectarFantasmas.mockResolvedValueOnce({
      total: 1,
      fantasmas: [{ arquivo: 'c.txt', referenciado: false, diasInativo: 0 }],
    });
    const lerEstado = vi.mocked((await import('./util/persistencia.js')).lerEstado);
    lerEstado.mockResolvedValueOnce([]); // anteriores
    lerEstado.mockResolvedValueOnce([]); // reativar
    lerEstado.mockResolvedValueOnce([]); // historico
    vi.mock('node:fs', () => ({
      promises: {
        mkdir: vi.fn(async () => undefined),
        rename: vi.fn(async () => {
          throw new Error('erro ao mover');
        }),
      },
    }));
    const { log } = await import('../nucleo/constelacao/log.js');
    await poda.executarPodaCiclica(true);
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro ao mover'));
  });
});
