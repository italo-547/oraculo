import { describe, it, expect, vi } from 'vitest';
import { comandoDiagnosticar } from './comando-diagnosticar.js';
import { Command } from 'commander';
import * as cosmos from '../nucleo/constelacao/cosmos.js';
import * as sentinela from '../guardian/sentinela.js';
import * as inquisidor from '../nucleo/inquisidor.js';

// Evita exits
process.env.VITEST = '1';

// Mocks básicos
vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [], tempoMs: 1 })),
  prepararComAst: vi.fn(async () => []),
  executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

vi.mock('../guardian/sentinela.js', () => ({
  scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
}));

vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({
  exibirRelatorioZeladorSaude: vi.fn(),
}));
vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
vi.mock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));

function buildCLI() {
  const program = new Command();
  program.addCommand(comandoDiagnosticar(() => {}));
  return program;
}

describe('comando-diagnosticar branches', () => {
  it('modo json sem guardian e sem erros', async () => {
    const cli = buildCLI();
    const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cli.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const output = spyLog.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/"status":"ok"/);
    spyLog.mockRestore();
  });

  it('guardian detecta alterações incrementa ocorrencias', async () => {
    (sentinela.scanSystemIntegrity as any).mockResolvedValueOnce({
      status: 'alteracoes-detectadas',
    });
    (inquisidor.executarInquisicao as any).mockResolvedValueOnce({
      ocorrencias: [],
      fileEntries: [],
    });
    const cli = buildCLI();
    const spyWarn = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cli.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check', '--json']);
    const output = spyWarn.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/"guardian":"alteracoes-detectadas"/);
    spyWarn.mockRestore();
  });

  it('parse errors agregados elevam status erro quando PARSE_ERRO_FALHA', async () => {
    cosmos.config.PARSE_ERRO_FALHA = true;
    // simula parse erros via globals
    (globalThis as any).__ORACULO_PARSE_ERROS__ = [
      { tipo: 'PARSE_ERRO', mensagem: 'falhou', relPath: 'x.ts', nivel: 'aviso' },
    ];
    (inquisidor.executarInquisicao as any).mockResolvedValueOnce({
      ocorrencias: [],
      fileEntries: [],
    });
    const cli = buildCLI();
    const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cli.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const output = spyLog.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/"status":"erro"/);
    cosmos.config.PARSE_ERRO_FALHA = false;
    spyLog.mockRestore();
  });
});
