import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarInquisicao } from './executor.js';
import { config } from './constelacao/cosmos.js';

vi.mock('./constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));
import { log } from './constelacao/log.js';

function entry(rel: string, content: string) {
  return { relPath: rel, content, fullPath: rel, ast: null as any } as any;
}

describe('executor branches adicionais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(config, {
      ANALISE_INCREMENTAL_ENABLED: false,
      ANALISE_METRICAS_ENABLED: true,
      ANALISE_METRICAS_HISTORICO_PATH: undefined,
      LOG_ESTRUTURADO: true,
      DEV_MODE: true,
    });
  });

  it('executa técnica global com logs estruturados', async () => {
    const tecnicaGlobal = {
      nome: 'globalX',
      global: true,
      aplicar: vi.fn().mockResolvedValue([{ tipo: 'A', mensagem: 'm', relPath: 'x' }]),
    } as any;
    const res = await executarInquisicao(
      [entry('a.js', '1')],
      [tecnicaGlobal],
      '/',
      {},
      {
        verbose: true,
      },
    );
    expect(res.ocorrencias.length).toBe(1);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('"tipo":"analista"'));
  });

  it('captura erro em técnica global e cria ocorrência de erro', async () => {
    const tecnicaGlobal = {
      nome: 'globalErr',
      global: true,
      aplicar: vi.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const res = await executarInquisicao([entry('a.js', '1')], [tecnicaGlobal], '/', {}, {});
    expect(res.ocorrencias.some((o) => o.mensagem?.includes('boom'))).toBe(true);
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('globalErr'));
  });

  it('ignora técnica por arquivo cujo test retorna false', async () => {
    const tecnica = {
      nome: 'fileAnalyst',
      global: false,
      test: (p: string) => p.endsWith('b.js'),
      aplicar: vi.fn(),
    } as any;
    await executarInquisicao([entry('a.js', '1')], [tecnica], '/', {}, {});
    expect(tecnica.aplicar).not.toHaveBeenCalled();
  });

  it('persiste histórico de métricas e trata falha', async () => {
    const tecnica = {
      nome: 't',
      global: false,
      test: () => true,
      aplicar: vi.fn().mockResolvedValue(null),
    } as any;
    const tmp = Date.now();
    // Usa subpasta dedicada para evitar poluir raiz do projeto com hist-*.json
    config.ANALISE_METRICAS_HISTORICO_PATH = `.oraculo/historico-metricas/hist-${tmp}.json`;
    const salvarSpy = vi.spyOn(await import('../zeladores/util/persistencia.js'), 'salvarEstado');
    await executarInquisicao([entry('a.js', '1')], [tecnica], '/', {}, {});
    expect(salvarSpy).toHaveBeenCalled();
    salvarSpy.mockRejectedValueOnce(new Error('histfail'));
    await executarInquisicao([entry('b.js', '2')], [tecnica], '/', {}, {});
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('histfail'));
  });
});
