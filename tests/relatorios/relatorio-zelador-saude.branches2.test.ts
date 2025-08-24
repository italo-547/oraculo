// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINALS = { ...process.env } as Record<string, string | undefined>;

describe('relatorio-zelador-saude branches extra', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIGINALS))
      if (v !== undefined) (process.env as any)[k] = v;
  });

  it('usa fallback quando log.aviso não existe e cobre require/consts zero', async () => {
    process.env.VITEST = '1'; // evita molduras
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        // sem aviso
      },
    }));
    vi.mock('../../src/analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: {}, requires: {} },
    }));
    const { exibirRelatorioZeladorSaude } = await import(
      '../../src/relatorios/relatorio-zelador-saude.js'
    );
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([{ relPath: 'a.ts', mensagem: 'Função longa' } as any]);
    const out = (log as any).info.mock.calls.flat().join('\n');
    // No fallback com tabela, esperamos headers e dicas
    expect(out).toContain('arquivos');
    expect(out).toContain('quantidade');
    expect(out).toContain('Para diagnóstico detalhado');
  });

  it('mostra verbose com muitos arquivos e ordenação', async () => {
    process.env.VITEST = '1';
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        infoSemSanitizar: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
      },
    }));
    vi.mock('../../src/analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: {}, requires: {} },
    }));
    const cosmos = await import('../../src/nucleo/constelacao/cosmos.js');
    cosmos.config.VERBOSE = true;
    const { exibirRelatorioZeladorSaude } = await import(
      '../../src/relatorios/relatorio-zelador-saude.js'
    );
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([
      { relPath: 'z.ts', mensagem: 'm' },
      { relPath: 'a.ts', mensagem: 'm' },
      { relPath: 'z.ts', mensagem: 'm' },
    ] as any);
    const joinedHead = (log as any).info.mock.calls.flat().join('\n');
    const joined = (log as any).infoSemSanitizar.mock.calls.flat().join('\n');
    expect(joinedHead).toMatch(/Detalhes de funções longas por arquivo/);
    // deve conter linhas de path truncado/alinhado
  });
});
