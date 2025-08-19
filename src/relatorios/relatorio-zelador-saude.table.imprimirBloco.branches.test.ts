// SPDX-License-Identifier: MIT
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

describe('relatorio-zelador-saude — tabela com imprimirBloco', () => {
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

  it('usa imprimirBloco quando disponível em modo tabela (não verbose)', async () => {
    // Mock do log com imprimirBloco presente
    vi.mock('../nucleo/constelacao/log.js', () => {
      const imprimirBloco = vi.fn();
      const info = vi.fn();
      const sucesso = vi.fn();
      const aviso = vi.fn();
      return { log: { imprimirBloco, info, sucesso, aviso } };
    });

    // Configurações para cair no ramo (mostrarTabela && temImprimirBloco)
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.VERBOSE = false;
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = true;

    // Importa função sob teste
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');

    // Executa com ocorrências para habilitar seção de funções longas
    exibirRelatorioZeladorSaude([
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'a.ts', linha: 1 },
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'b.ts', linha: 2 },
    ] as any);

    // Verifica que imprimirBloco foi usado na tabela resumida
    expect((log as any).imprimirBloco).toHaveBeenCalled();
    const titles = (log as any).imprimirBloco.mock.calls.map((c: any[]) => String(c[0])).join('\n');
    expect(titles).toMatch(/funções longas:/i);

    // Dicas pós-tabela também devem ser emitidas via info
    const infoJoined = (log as any).info.mock.calls.flat().join('\n');
    expect(infoJoined).toMatch(/diagnóstico detalhado/i);
  });
});
