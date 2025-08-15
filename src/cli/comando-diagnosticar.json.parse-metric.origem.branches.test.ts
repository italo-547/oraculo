import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks para fluxo mínimo com uma ocorrência PARSE_ERRO
vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', conteudo: '' }] }),
  prepararComAst: async (fe: any[]) => fe,
  executarInquisicao: async () => ({
    ocorrencias: [
      { tipo: 'PARSE_ERRO', relPath: 'a.ts', mensagem: 'x', nivel: 'aviso' },
    ],
    metricas: undefined,
  }),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));
vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({ exibirRelatorioZeladorSaude: vi.fn() }));
vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
vi.mock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
vi.mock('../relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));
vi.mock('../analistas/detector-arquetipos.js', () => ({ detectarArquetipos: vi.fn(async () => undefined) }));

// log no-op
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn(), imprimirBloco: vi.fn(),
    simbolos: { info: 'ℹ️', sucesso: '✅', erro: '❌', aviso: '⚠️', debug: '🐞', fase: '🔶', passo: '▫️', scan: '🔍', guardian: '🛡️', pasta: '📂' },
  },
}));

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).__ORACULO_PARSE_ERROS_ORIGINAIS__ = undefined;
});

describe('comando-diagnosticar – JSON parse metric originais', () => {
  it('usa __ORACULO_PARSE_ERROS_ORIGINAIS__ para calcular agregados', async () => {
    // Define total original de parse-erros maior que o exibido
    (globalThis as any).__ORACULO_PARSE_ERROS_ORIGINAIS__ = 3;

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (s: any) => { logs.push(String(s)); };

    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } finally {
      console.log = origLog;
    }

    const out = logs.join('\n');
    const json = JSON.parse(out);
    expect(json.parseErros.totalOriginais).toBe(3);
    expect(json.parseErros.totalExibidos).toBe(1);
    expect(json.parseErros.agregados).toBe(2);
    expect(json).not.toHaveProperty('estruturaIdentificada');
  }, 15000);
});
