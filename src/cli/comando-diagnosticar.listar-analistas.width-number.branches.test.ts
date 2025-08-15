import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar — listar-analistas com calcularLargura numérico', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('usa o valor retornado por log.calcularLargura quando disponível', async () => {
    const imprimirBloco = vi.fn();
    const logMock = {
      info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn(), debug: vi.fn(),
      imprimirBloco,
      calcularLargura: vi.fn(() => 70),
    } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x, cyan: { bold: (x: string) => x } } }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
        COMPACT_MODE: true, // compact para variar a largura padrão, mas iremos usar 70
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: true, // encerra cedo após listar, evitando execuções desnecessárias
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        DEV_MODE: true,
        GUARDIAN_BASELINE: '.oraculo/baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(),
      executarInquisicao: vi.fn(),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    // Sucesso no import dinâmico com uma técnica simples
    vi.doMock('../analistas/registry.js', () => ({
      listarAnalistas: () => [ { nome: 'A', categoria: 'X', descricao: 'd' } ],
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas']);

    expect(logMock.calcularLargura).toHaveBeenCalled();
    // Terceiro argumento de imprimirBloco é o estilizador, o quarto é a largura
    const larguraUsada = imprimirBloco.mock.calls[0]?.[3];
    expect(larguraUsada).toBe(70);
  });
});
