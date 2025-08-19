// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Evita erro de hoisting do vi.mock: declara spies com vi.hoisted
const { info, sucesso } = vi.hoisted(() => ({
  info: vi.fn(),
  sucesso: vi.fn(),
}));

describe('relatorio-zelador-saude — branches adicionais (aviso fallback e infoSemSanitizar ausente)', () => {
  const origEnv = { ...process.env } as Record<string, string | undefined>;
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1'; // sem molduras
  });
  afterEach(() => {
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(origEnv)) if (v !== undefined) (process.env as any)[k] = v;
    vi.restoreAllMocks();
  });

  it('usa log.info quando log.aviso não existe e imprime verbose com info (sem infoSemSanitizar)', async () => {
    vi.mock('../analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: { A: 1 }, requires: { fs: 1 } }, // não entra nos blocos
    }));
    vi.mock('../nucleo/constelacao/log.js', () => ({ log: { info, sucesso } }));
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.VERBOSE = true;
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = true;

    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    exibirRelatorioZeladorSaude([
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'a/long.ts', linha: 1 },
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'b/long.ts', linha: 2 },
    ] as any);

    const joined = info.mock.calls.flat().join('\n');
    expect(joined).toContain('⚠️ Funções longas encontradas:'); // fallback via info
    expect(joined).toContain('Detalhes de funções longas por arquivo'); // ramo verbose
    expect(joined).not.toMatch(/Constantes definidas mais de 3 vezes/);
    expect(joined).not.toMatch(/Módulos require utilizados mais de 3 vezes/);
    expect(sucesso).toHaveBeenCalled(); // rodapé
  });
});
