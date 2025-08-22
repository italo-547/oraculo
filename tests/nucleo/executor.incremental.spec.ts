import { describe, it, expect, vi } from 'vitest';
import { executarInquisicao } from '../../src/nucleo/executor.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

describe('nucleo/executor incremental branches', () => {
  it('persiste metricas historico falha segura', async () => {
    // força caminho onde salvarEstado falha ao persistir historico
    const original = config.ANALISE_METRICAS_HISTORICO_PATH;
    try {
      // aponta para local que vai falhar (diretorio inexistente) e ativa a flag
      config.ANALISE_METRICAS_HISTORICO_PATH = '/___caminho_invalido___/hist.json';
      config.ANALISE_METRICAS_ENABLED = true;
      // executa com lista vazia (sem arquivos) para acionar persistencia sem processar analistas
      const res = await executarInquisicao([], [], process.cwd(), undefined);
      expect(res).toBeDefined();
      // quando persistencia falha em DEV_MODE, apenas não deve lançar
      expect(res.totalArquivos).toBe(0);
    } finally {
      config.ANALISE_METRICAS_HISTORICO_PATH = original;
      config.ANALISE_METRICAS_ENABLED = false;
    }
  });
});
