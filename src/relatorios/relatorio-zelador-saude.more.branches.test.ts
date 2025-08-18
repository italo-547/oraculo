// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('relatorio-zelador-saude ramos extras', () => {
  const origEnv = { ...process.env } as Record<string, string | undefined>;
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1'; // evita molduras de cabeçalho/rodapé
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(origEnv)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('fallback da tabela quando não há imprimirBloco (usa info/infoSemSanitizar)', async () => {
    vi.mock('../nucleo/constelacao/log.js', () => {
      const info = vi.fn();
      const infoSemSanitizar = vi.fn();
      const sucesso = vi.fn();
      const aviso = vi.fn();
      return { log: { info, infoSemSanitizar, sucesso, aviso } };
    });
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.VERBOSE = false;
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = true;
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'a.ts', linha: 1 },
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'b.ts', linha: 2 },
    ] as any);
    const callsInfo = (log as any).info.mock.calls.flat().join('\n');
    const callsInfoRaw = (log as any).infoSemSanitizar.mock.calls.flat().join('\n');
    expect(callsInfo).toContain('arquivos');
    expect(callsInfo).toContain('quantidade');
    expect(callsInfoRaw).toContain('funções longas (total)');
  });

  it('modo verbose: imprime detalhes por arquivo (sem moldura)', async () => {
    vi.mock('../nucleo/constelacao/log.js', () => {
      const info = vi.fn();
      const infoSemSanitizar = vi.fn();
      const sucesso = vi.fn();
      const aviso = vi.fn();
      return { log: { info, infoSemSanitizar, sucesso, aviso } };
    });
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.VERBOSE = true;
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = true; // ignorado em verbose
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'x/long.ts', linha: 1 },
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'y/long.ts', linha: 2 },
    ] as any);
    const joinedInfo = (log as any).info.mock.calls.flat().join('\n');
    const joinedRaw = (log as any).infoSemSanitizar.mock.calls.flat().join('\n');
    const joined = [joinedInfo, joinedRaw].join('\n');
    expect(joined).toContain('Detalhes de funções longas por arquivo');
    expect(joined).toMatch(/long\.ts|x\/long\.ts|y\/long\.ts/);
  });

  it('lista consts e requires repetidos quando acima do limite', async () => {
    vi.mock('../analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: {
        consts: { A: 4, B: 2 },
        requires: { mod1: 5, mod2: 1 },
      },
    }));
    vi.mock('../nucleo/constelacao/log.js', () => {
      const info = vi.fn();
      const infoSemSanitizar = vi.fn();
      const sucesso = vi.fn();
      const aviso = vi.fn();
      return { log: { info, infoSemSanitizar, sucesso, aviso } };
    });
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([]);
    const out = (log as any).info.mock.calls.flat().join('\n');
    expect(out).toContain('Constantes definidas mais de 3 vezes');
    expect(out).toContain('A: 4');
    expect(out).toContain('Módulos require utilizados mais de 3 vezes');
    expect(out).toContain('mod1: 5');
    expect((log as any).sucesso).toHaveBeenCalled(); // rodapé
  });
});
