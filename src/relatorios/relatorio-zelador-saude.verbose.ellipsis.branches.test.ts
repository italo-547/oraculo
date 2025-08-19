// SPDX-License-Identifier: MIT
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

describe('relatorio-zelador-saude — verbose com elipse em caminho longo', () => {
  const ORIG: Record<string, string | undefined> = { ...process.env } as any;

  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1'; // sem molduras
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('trunca caminho com … quando excede largura da coluna', async () => {
    vi.mock('../nucleo/constelacao/log.js', () => {
      const info = vi.fn();
      const infoSemSanitizar = vi.fn();
      const sucesso = vi.fn();
      const aviso = vi.fn();
      return { log: { info, infoSemSanitizar, sucesso, aviso } };
    });
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.VERBOSE = true;
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = false;

    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');

    // Gera um caminho > 50 chars para acionar o ramo que adiciona …
    const longPath = 'some/really/very/very/long/path/that/exceeds/fifty/characters/file.ts';
    exibirRelatorioZeladorSaude([
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: longPath, linha: 1 },
      {
        tipo: 'FUNCAO_LONGA',
        nivel: 'aviso',
        mensagem: 'm',
        relPath: longPath.replace('file', 'file2'),
        linha: 2,
      },
    ] as any);

    const titulo = (log as any).info.mock.calls.flat().join('\n');
    const linhas = (log as any).infoSemSanitizar.mock.calls.flat().join('\n');
    expect(titulo).toContain('Detalhes de funções longas por arquivo');
    expect(linhas).toContain('…'); // usa reticências no truncamento do caminho
    expect((log as any).sucesso).toHaveBeenCalled();
  });
});
