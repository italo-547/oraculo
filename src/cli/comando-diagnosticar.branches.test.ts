// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

// Mocks dos módulos pesados usados pelo comando
vi.mock('../nucleo/inquisidor.js', () => {
  return {
    iniciarInquisicao: vi.fn(async () => ({
      fileEntries: [{ relPath: 'a.ts' }, { relPath: 'b.ts' }],
    })),
    prepararComAst: vi.fn(async (entries: any) => entries),
    executarInquisicao: vi.fn(async () => ({
      ocorrencias: [
        { tipo: 'TODO_PENDENTE', relPath: 'a.ts', mensagem: 'todo', nivel: 'aviso' },
        { tipo: 'PARSE_ERRO', relPath: 'b.ts', mensagem: 'parse', nivel: 'erro' },
      ],
    })),
    registrarUltimasMetricas: vi.fn(),
    tecnicas: [],
  };
});

vi.mock('../analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: vi.fn(async () => undefined),
}));

vi.mock('../relatorios/gerador-relatorio.js', () => ({
  gerarRelatorioMarkdown: vi.fn(async () => undefined),
}));

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

// Evita execução de relatórios complexos quando COMPACT_MODE=false
vi.mock('../arquitetos/analista-estrutura.js', () => ({
  alinhamentoEstrutural: vi.fn(async () => []),
}));
vi.mock('../relatorios/relatorio-estrutura.js', () => ({
  gerarRelatorioEstrutura: vi.fn(() => undefined),
}));
vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({
  exibirRelatorioZeladorSaude: vi.fn(() => undefined),
}));
vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({
  exibirRelatorioPadroesUso: vi.fn(() => undefined),
}));
vi.mock('../arquitetos/diagnostico-projeto.js', () => ({
  diagnosticarProjeto: vi.fn(() => undefined),
}));
vi.mock('../relatorios/conselheiro-oracular.js', () => ({
  emitirConselhoOracular: vi.fn(() => undefined),
}));

// registry usado pela flag --listar-analistas
vi.mock('../analistas/registry.js', () => ({
  listarAnalistas: () => [{ nome: 'foo', categoria: 'demo', descricao: 'analista fake' }],
}));

// Mocks para log: só espiamos imprimirBloco
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

// Importa o comando-alvo
import { comandoDiagnosticar } from './comando-diagnosticar.js';

const restoreEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  // Snapshot de env sensíveis
  ['ORACULO_FRAME_MAX_COLS', 'ORACULO_ASCII_FRAMES', 'VITEST'].forEach((k) => {
    restoreEnv[k] = process.env[k];
  });
  // força largura pequena determinística nos frames
  process.env.ORACULO_FRAME_MAX_COLS = '84';
  process.env.ORACULO_ASCII_FRAMES = '1';
  // garante que o comando não tente encerrar o processo por padrão
  process.env.VITEST = '1';
});

afterEach(() => {
  vi.restoreAllMocks();
  // restaura env
  Object.entries(restoreEnv).forEach(([k, v]) => {
    if (v === undefined) delete (process.env as any)[k];
    else process.env[k] = v;
  });
});

describe('comando-diagnosticar (branches)', () => {
  it('executa exportação de relatórios (não-JSON) e imprime bloco de resumo de tipos', async () => {
    // Config: modo compacto para pular relatórios pesados e habilita export
    config.COMPACT_MODE = true;
    config.REPORT_EXPORT_ENABLED = true;
    config.REPORT_OUTPUT_DIR = path.join(process.cwd(), 'relatorios-test');

    const spyImprimir = vi.spyOn(log, 'imprimirBloco');
    const spySucesso = vi.spyOn(log, 'sucesso').mockImplementation(() => undefined as any);
    const spyInfo = vi.spyOn(log, 'info').mockImplementation(() => undefined as any);
    const spyAviso = vi.spyOn(log, 'aviso').mockImplementation(() => undefined as any);

    const cmd = comandoDiagnosticar(() => undefined);
    await cmd.parseAsync(['node', 'cli', '--compact']);

    // Deve ter chamado ao menos um bloco (resumo tipos)
    expect(spyImprimir).toHaveBeenCalled();
    // Exportação concluída com mensagem de sucesso
    expect(spySucesso).toHaveBeenCalledWith(expect.stringContaining('Relatórios exportados para'));
    // Resumo de tipos ecoa header/linhas (info/aviso chamados)
    expect(spyInfo).toHaveBeenCalled();
    expect(spyAviso).toHaveBeenCalled();
  });

  it('exibe bloco de despedida fora de ambiente de testes (simulado) quando há ocorrências', async () => {
    config.COMPACT_MODE = true;
    config.REPORT_EXPORT_ENABLED = false;

    // Remove flag de ambiente VITEST temporariamente para atravessar guarda
    const vitestPrev = process.env.VITEST;
    delete (process.env as Record<string, any>).VITEST;

    // Evita encerrar runner
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as unknown as any);
    const spyImprimir = vi.spyOn(log, 'imprimirBloco');
    const cmd = comandoDiagnosticar(() => undefined);
    await cmd.parseAsync(['node', 'cli', '--compact']);

    // Despedida tem título "Tudo pronto"
    const chamouDespedida = spyImprimir.mock.calls.some((c) =>
      String(c[0]).includes('Tudo pronto'),
    );
    expect(chamouDespedida).toBe(true);

    // Restaura VITEST imediatamente
    if (vitestPrev === undefined) delete (process.env as any).VITEST;
    else process.env.VITEST = vitestPrev;
    exitSpy.mockRestore();
  });
});
