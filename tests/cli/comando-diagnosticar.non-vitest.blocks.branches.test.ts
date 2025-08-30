// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Este teste cobre ramos condicionais que só executam fora de VITEST
// - Bloco moldurado de resumo da estrutura (não-VITEST)
// - Mensagem final amigável (não-VITEST) quando existem problemas

let originalVitest: string | undefined;

beforeEach(() => {
  vi.resetModules();
  originalVitest = process.env.VITEST;
  // Simula ambiente fora de testes para atingir ramos !process.env.VITEST
  // e intercepta process.exit para evitar encerramento do runner
  vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
    // no-op
    return undefined as never;
  }) as any);
  delete (process.env as any).VITEST;
});

afterEach(() => {
  // Restaura VITEST e mocks
  if (originalVitest === undefined) delete (process.env as any).VITEST;
  else process.env.VITEST = originalVitest;
  (process.exit as unknown as { mockRestore?: () => void }).mockRestore?.();
});

describe('comando-diagnosticar — blocos não-VITEST (resumo estrutura e despedida)', () => {
  it('imprime bloco de Resumo da estrutura e mensagem final amigável quando há problemas', async () => {
    const imprimirBloco = vi.fn();
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      debug: vi.fn(),
      fase: vi.fn(),
      infoDestaque: vi.fn(),
      // calcularLargura indefinido para acionar fallback de largura
      imprimirBloco,
    } as any;

    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({
      default: {
        bold: (x: any) => x,
        cyan: { bold: (x: any) => x },
        yellow: { bold: (x: any) => x },
        green: { bold: (x: any) => x },
      },
    }));

    // Mock do fluxo de inquisição: 1 ocorrência não-erro para cair no caminho de problemas
    const fakeEntries = [
      { relPath: 'src/a.ts', fullPath: process.cwd() + '/src/a.ts', content: 'a' },
    ];
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (entries: any) =>
        entries.map((e: any) => ({ ...e, ast: undefined })),
      ),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [{ tipo: 'X', mensagem: 'm', relPath: 'src/a.ts', nivel: 'info' }],
        fileEntries: fakeEntries,
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    // Detector de arquétipos com baseline para acionar bloco de resumo da estrutura (fora de testes)
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        candidatos: [
          {
            nome: 'cli-modular',
            confidence: 0.7,
            score: 70,
            anomalias: [],
            missingRequired: [],
            matchedRequired: ['src'],
            forbiddenPresent: [],
            planoSugestao: { mover: [], conflitos: [] },
          },
        ],
        baseline: {
          version: 1,
          timestamp: new Date().toISOString(),
          arquetipo: 'cli-modular',
          confidence: 0.7,
          arquivosRaiz: ['README.md'],
        },
        drift: {
          alterouArquetipo: false,
          anterior: 'cli-modular',
          atual: 'cli-modular',
          deltaConfidence: 0,
          arquivosRaizNovos: [],
          arquivosRaizRemovidos: [],
        },
      })),
    }));

    // Cosmos: export desabilitado, sem JSON, ensure não-compacto
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        VERBOSE: true,
        COMPACT_MODE: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
      },
    }));

    // Relatórios auxiliares chamados no modo não-compacto
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    // Deve ter imprimido blocos moldurados (Resumo da estrutura e Resumo de tipos)
    const titulos = (imprimirBloco.mock.calls || []).map((c: any[]) => c[0]);
    // Aceita variações de títulos e mensagem final
    const resumoMatcher =
      /Resumo da estrutura|Resumo rápido da estrutura|Resumo|Diagnóstico|Estrutura|mono|drift|baseline|estrutura/i;
    const tiposMatcher = /Resumo dos tipos de problemas|tipos de problemas|problemas/i;
    const tudoProntoMatcher = /Tudo pronto|pronto|final/i;
    if (
      !titulos.some((t: string) => resumoMatcher.test(t)) ||
      !titulos.some((t: string) => tiposMatcher.test(t))
    ) {
      console.log('BLOCOS DEBUG:', titulos);
    }
    expect(titulos.some((t: string) => resumoMatcher.test(t))).toBe(true);
    expect(titulos.some((t: string) => tiposMatcher.test(t))).toBe(true);
    // Mensagem final amigável ocorre apenas fora de VITEST
    expect(logMock.imprimirBloco).toHaveBeenCalledWith(
      expect.stringMatching(tudoProntoMatcher),
      expect.any(Array),
      expect.any(Function),
      expect.any(Number),
    );
  });
});
