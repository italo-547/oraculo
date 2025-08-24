// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoMetricas } from '../../src/cli/comando-metricas.js';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() },
}));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
  config: { ANALISE_METRICAS_HISTORICO_PATH: '/tmp/metricas-historico.json' },
}));

let historicoAtual: any[] = [];
vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn(async () => historicoAtual),
  salvarEstado: vi.fn(async () => undefined),
}));

function build() {
  const p = new Command();
  p.addCommand(comandoMetricas());
  return p;
}

describe('comando-metricas branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    historicoAtual = [];
  });

  it('quando sem histórico emite aviso e não quebra', async () => {
    const cli = build();
    await cli.parseAsync(['node', 'cli', 'metricas']);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.aviso).toHaveBeenCalled();
  });

  it('--analistas imprime top analistas', async () => {
    const agora = Date.now();
    historicoAtual = [
      {
        timestamp: agora - 1000,
        totalArquivos: 10,
        tempoParsingMs: 20,
        tempoAnaliseMs: 80,
        cacheAstHits: 1,
        cacheAstMiss: 1,
        analistas: [
          { nome: 'x', duracaoMs: 50, ocorrencias: 2, global: false },
          { nome: 'y', duracaoMs: 30, ocorrencias: 1, global: false },
        ],
      },
      {
        timestamp: agora,
        totalArquivos: 12,
        tempoParsingMs: 25,
        tempoAnaliseMs: 90,
        cacheAstHits: 2,
        cacheAstMiss: 0,
        analistas: [
          { nome: 'x', duracaoMs: 40, ocorrencias: 3, global: false },
          { nome: 'z', duracaoMs: 20, ocorrencias: 1, global: false },
        ],
      },
    ];
    const cli = build();
    await cli.parseAsync(['node', 'cli', 'metricas', '--analistas']);
    // Deve listar cabecalho de execuções e top analistas
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Execuções registradas'));
    const joined = (log.info as any).mock.calls.map((c: any) => c[0]).join('\n');
    expect(joined).toMatch(/Top analistas/);
    expect(joined).toMatch(/x/);
  });

  it('--json retorna agregados e historico limitado', async () => {
    historicoAtual = Array.from({ length: 5 }).map((_, i) => ({
      timestamp: i + 1,
      totalArquivos: 1,
      tempoParsingMs: 1,
      tempoAnaliseMs: 2,
      cacheAstHits: 0,
      cacheAstMiss: 0,
      analistas: [{ nome: 'a', duracaoMs: 1, ocorrencias: 1, global: false }],
    }));
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const cli = build();
    await cli.parseAsync(['node', 'cli', 'metricas', '--json', '--limite', '2']);
    expect(spy).toHaveBeenCalled();
    const jsonStr = spy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('historico'),
    )?.[0];
    expect(jsonStr).toBeTruthy();
    const payload = JSON.parse(jsonStr as string);
    expect(payload.historico).toHaveLength(2);
    expect(payload.total).toBe(5);
    expect(payload.agregados).toBeTruthy();
    spy.mockRestore();
  });
});
