import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock de log com imprimirBloco para capturar chamadas de moldura
const imprimirBloco = vi.fn();
const info = vi.fn();
const aviso = vi.fn();
const sucesso = vi.fn();

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    calcularLargura: () => 84,
    imprimirBloco,
    info,
    aviso,
    sucesso,
  },
}));

// Estatísticas com consts/requires em excesso
vi.mock('../analistas/analista-padroes-uso.js', () => ({
  estatisticasUsoGlobal: {
    consts: { A: 5, B: 1 },
    requires: { R: 9 },
  },
}));

const ORIGINAL_VITEST = process.env.VITEST;

beforeEach(async () => {
  vi.resetModules();
  // Força ambiente não-test para habilitar molduras
  delete (process.env as any).VITEST;
  imprimirBloco.mockClear();
  info.mockClear();
  aviso.mockClear();
  sucesso.mockClear();
});

afterEach(() => {
  // Restaura flag VITEST para não afetar outros testes
  if (ORIGINAL_VITEST !== undefined) process.env.VITEST = ORIGINAL_VITEST as string;
  else delete (process.env as any).VITEST;
  vi.restoreAllMocks();
});

describe('relatorio-zelador-saude ramos de moldura e tabela', () => {
  it('emite cabeçalho e rodapé com moldura quando não está sob VITEST', async () => {
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    exibirRelatorioZeladorSaude([{ relPath: 'x.ts', linha: 1, mensagem: 'Função longa' } as any]);
    // Deve chamar imprimirBloco ao menos duas vezes (cabeçalho e rodapé)
    expect(imprimirBloco.mock.calls.length).toBeGreaterThanOrEqual(2);
    const titles = imprimirBloco.mock.calls.map((c) => String(c[0])).join('\n');
    expect(titles).toMatch(/Relatório de Saúde do Código/);
    expect(titles).toMatch(/Fim do relatório do zelador/);
  });

  it('mostra tabela resumida quando RELATORIO_SAUDE_TABELA_ENABLED e não verbose', async () => {
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = true;
    cosmos.config.VERBOSE = false;
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    imprimirBloco.mockClear();
    exibirRelatorioZeladorSaude([{ relPath: 'y.ts', linha: 2, mensagem: 'Função longa' } as any]);
    // Deve ter chamado imprimirBloco com título contendo 'funções longas:'
    const calledWith = imprimirBloco.mock.calls.map((c) => String(c[0])).join('\n');
    expect(calledWith).toMatch(/funções longas:/);
  });
});
