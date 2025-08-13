import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { comandoMetricas } from './comando-metricas.js';

vi.mock('../nucleo/constelacao/cosmos.js', () => ({
  config: { ANALISE_METRICAS_HISTORICO_PATH: '/tmp/metricas-historico.json' },
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() },
}));
vi.mock('../zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn().mockResolvedValue([
    {
      timestamp: 1,
      totalArquivos: 3,
      tempoParsingMs: 10,
      tempoAnaliseMs: 50,
      cacheAstHits: 2,
      cacheAstMiss: 1,
      analistas: [{ nome: 'a1', duracaoMs: 10, ocorrencias: 1, global: false }],
    },
    {
      timestamp: 2,
      totalArquivos: 5,
      tempoParsingMs: 15,
      tempoAnaliseMs: 70,
      cacheAstHits: 3,
      cacheAstMiss: 0,
      analistas: [{ nome: 'a1', duracaoMs: 12, ocorrencias: 2, global: false }],
    },
  ]),
  salvarEstado: vi.fn().mockResolvedValue(undefined),
}));

import { log } from '../nucleo/constelacao/log.js';
import { lerEstado, salvarEstado } from '../zeladores/util/persistencia.js';

describe('comando-metricas', () => {
  it('exibe historico em texto', async () => {
    const program = new Command();
    program.addCommand(comandoMetricas());
    await program.parseAsync(['node', 'cli', 'metricas']);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Execuções registradas'));
  });

  it('exibe json', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = new Command();
    program.addCommand(comandoMetricas());
    await program.parseAsync(['node', 'cli', 'metricas', '--json']);
    expect(spy).toHaveBeenCalled();
    const payloadStr = (spy.mock.calls.at(-1)?.[0] as string) || '';
    expect(payloadStr).toContain('"historico"');
    spy.mockRestore();
  });

  it('exporta historico', async () => {
    const program = new Command();
    program.addCommand(comandoMetricas());
    await program.parseAsync(['node', 'cli', 'metricas', '--export', 'hist.json']);
    expect(salvarEstado).toHaveBeenCalled();
  });
});
