// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
// Não importar IntegridadeStatus para uso dentro de vi.hoisted; usar literais para evitar hoisting issues

describe('comando-diagnosticar — guardian statuses (Ok, Criado, Aceito)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Estado hoisted compartilhado pelas factories de mock
  const state = vi.hoisted(() => ({
    statusAtual: 'ok',
    logMock: {
      info: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      sucesso: vi.fn(),
      fase: vi.fn(),
      imprimirBloco: vi.fn(),
    } as any,
  }));

  // Mocks hoisted: sempre referenciam `state`, que pode ser ajustado por teste
  vi.mock('../nucleo/constelacao/log.js', () => ({ log: state.logMock }));
  vi.mock('../nucleo/constelacao/cosmos.js', () => ({
    config: {
      VERBOSE: false,
      COMPACT_MODE: true,
      REPORT_EXPORT_ENABLED: false,
      SCAN_ONLY: false,
      DEV_MODE: false,
      GUARDIAN_ENABLED: true,
      GUARDIAN_ENFORCE_PROTECTION: false,
      GUARDIAN_BASELINE: 'guardian-baseline.json',
      ZELADOR_STATE_DIR: 'inc-state',
    },
  }));
  vi.mock('../nucleo/inquisidor.js', () => ({
    iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] }),
    prepararComAst: async (f: any) => f,
    executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
    registrarUltimasMetricas: vi.fn(),
    tecnicas: [],
  }));
  vi.mock('../arquitetos/analista-estrutura.js', () => ({
    alinhamentoEstrutural: vi.fn(() => []),
  }));
  vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
  vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({
    exibirRelatorioZeladorSaude: vi.fn(),
  }));
  vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
  vi.mock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
  vi.mock('../guardian/sentinela.js', () => ({
    scanSystemIntegrity: async () => ({ status: state.statusAtual }),
  }));

  it('status Ok: loga sucesso e não incrementa problemas', async () => {
    // resetar mocks por teste
    state.statusAtual = 'ok';
    state.logMock.info = vi.fn();
    state.logMock.aviso = vi.fn();
    state.logMock.erro = vi.fn();
    state.logMock.sucesso = vi.fn();
    state.logMock.fase = vi.fn();
    (state.logMock as any).imprimirBloco = vi.fn();
    const program = new Command();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    expect(state.logMock.sucesso).toHaveBeenCalledWith(
      expect.stringContaining('integridade preservada'),
    );
    expect(state.logMock.aviso).not.toHaveBeenCalledWith(
      expect.stringContaining('Modo permissivo'),
    );
  });

  it('status Criado: loga info de baseline criado', async () => {
    state.statusAtual = 'baseline-criado';
    state.logMock.info = vi.fn();
    state.logMock.aviso = vi.fn();
    state.logMock.erro = vi.fn();
    state.logMock.sucesso = vi.fn();
    state.logMock.fase = vi.fn();
    (state.logMock as any).imprimirBloco = vi.fn();
    const program = new Command();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    expect(state.logMock.info).toHaveBeenCalledWith(expect.stringContaining('baseline criado'));
  });

  it('status Aceito: loga aviso de novo baseline aceito', async () => {
    state.statusAtual = 'baseline-aceito';
    state.logMock.info = vi.fn();
    state.logMock.aviso = vi.fn();
    state.logMock.erro = vi.fn();
    state.logMock.sucesso = vi.fn();
    state.logMock.fase = vi.fn();
    (state.logMock as any).imprimirBloco = vi.fn();
    const program = new Command();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    expect(state.logMock.aviso).toHaveBeenCalledWith(
      expect.stringContaining('novo baseline aceito'),
    );
  });
});
