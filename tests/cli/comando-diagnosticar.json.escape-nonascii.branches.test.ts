// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar – JSON escape de não-ASCII', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('escapa caracteres fora de ASCII no JSON impresso', async () => {
    // mocks mínimos
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', conteudo: '' }] }),
      prepararComAst: async (fe: any[]) => fe,
      executarInquisicao: async () => ({
        ocorrencias: [
          { tipo: 'X', relPath: 'a.ts', mensagem: 'olá', nivel: 'erro' }, // contém 'á'
        ],
        metricas: undefined,
      }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => undefined),
    }));
    vi.doMock('../relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        imprimirBloco: vi.fn(),
        simbolos: { info: 'i', sucesso: 's', erro: 'e', aviso: 'a' },
      },
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    const out: string[] = [];
    const orig = console.log;
    console.log = (s: any) => out.push(String(s));
    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } finally {
      console.log = orig;
    }

    const texto = out.join('\n');
    expect(texto).toMatch(/\\u00e1/); // "á" deve estar escapado como \u00e1
  });
});
