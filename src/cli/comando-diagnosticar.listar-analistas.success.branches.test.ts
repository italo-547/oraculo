import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – listar analistas (success branches)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('imprime bloco de técnicas ativas quando --listar-analistas (com calcularLargura)', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      imprimirBloco: vi.fn(),
      calcularLargura: vi.fn(() => 80),
    } as any;

    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.doMock('../analistas/registry.js', () => ({
      listarAnalistas: () => [
        { nome: 'analista-a', categoria: 'qualidade', descricao: 'desc a' },
        { nome: 'analista-b', categoria: 'estrutura', descricao: 'desc b' },
      ],
    }));
    // Mocks mínimos para passar pelo fluxo sem executar análise completa
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async (e: any) => e),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../guardian/sentinela.js', () => ({ scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })) }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({ alinhamentoEstrutural: vi.fn(() => []) }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn(() => ({})) }));
    vi.doMock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: vi.fn(() => []) }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({ exibirRelatorioZeladorSaude: vi.fn() }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    vi.doMock('chalk', () => ({ default: { cyan: { bold: (s: string) => s }, bold: (s: string) => s } }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

  await program.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas']);

    expect(logMock.imprimirBloco).toHaveBeenCalled();
    const [titulo, linhas, _color, largura] = logMock.imprimirBloco.mock.calls[0];
    expect(titulo).toBe('Técnicas ativas (registro de analistas)');
    expect(Array.isArray(linhas)).toBe(true);
    expect(largura).toBe(80); // vindo de calcularLargura mockado
  });

  it('imprime bloco de técnicas ativas (sem calcularLargura) e respeita modo compacto', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      imprimirBloco: vi.fn(),
      // calcularLargura ausente
    } as any;

    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
  vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.doMock('../analistas/registry.js', () => ({
      listarAnalistas: () => [
        { nome: 'analista-x', categoria: 'qualidade', descricao: 'x' },
      ],
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async (e: any) => e),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../guardian/sentinela.js', () => ({ scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })) }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({ alinhamentoEstrutural: vi.fn(() => []) }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn(() => ({})) }));
    vi.doMock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: vi.fn(() => []) }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({ exibirRelatorioZeladorSaude: vi.fn() }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    vi.doMock('chalk', () => ({ default: { cyan: { bold: (s: string) => s }, bold: (s: string) => s } }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

  await program.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas', '--compact']);

    expect(logMock.imprimirBloco).toHaveBeenCalled();
    const [titulo, _linhas, _color, largura] = logMock.imprimirBloco.mock.calls[0];
    expect(titulo).toBe('Técnicas ativas (registro de analistas)');
  // Sem calcularLargura, em modo compacto usa largura 84
  expect(largura).toBe(84);
  });
});
