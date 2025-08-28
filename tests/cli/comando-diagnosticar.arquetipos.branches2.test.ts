// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar.js';
import { log } from '../../src/nucleo/constelacao/log.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

// Para evitar problemas de hoisting do vi.mock, definimos factories inline nas chamadas de mock.
let arquetiposMode: 'movimentos' | 'nenhum' = 'movimentos';

const gerarArquetipoBase = () => {
  if (arquetiposMode === 'movimentos') {
    return {
      melhores: [
        {
          nome: 'monorepo',
          descricao: 'desc',
          score: 100,
          confidence: 90,
          matchedRequired: ['packages'],
          missingRequired: [],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: ['secret'],
          anomalias: Array.from({ length: 10 }, (_, i) => ({ path: `x${i}`, motivo: 'm' })),
          planoSugestao: {
            mover: [
              { de: 'a', para: 'b' },
              { de: 'c', para: 'd' },
              { de: 'e', para: 'f' },
              { de: 'g', para: 'h' },
              { de: 'i', para: 'j' },
            ],
            conflitos: [{}, {}],
            resumo: { total: 5, zonaVerde: 0, bloqueados: 0 },
          },
        },
      ],
      baseline: {
        version: 1,
        timestamp: new Date().toISOString(),
        arquetipo: 'monorepo',
        confidence: 80,
        arquivosRaiz: ['README.md'],
      },
      drift: {
        alterouArquetipo: false,
        anterior: 'monorepo',
        atual: 'monorepo',
        deltaConfidence: 10,
        arquivosRaizNovos: ['NOVO.md', 'A.md', 'B.md', 'C.md'],
        arquivosRaizRemovidos: ['VELHO.md', 'D.md', 'E.md', 'F.md'],
      },
    };
  }
  return {
    melhores: [
      {
        nome: 'monorepo',
        descricao: 'desc',
        score: 100,
        confidence: 95,
        matchedRequired: ['packages'],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        planoSugestao: {
          mover: [],
          conflitos: [],
          resumo: { total: 0, zonaVerde: 0, bloqueados: 0 },
        },
      },
    ],
    baseline: {
      version: 1,
      timestamp: new Date().toISOString(),
      arquetipo: 'monorepo',
      confidence: 95,
      arquivosRaiz: ['README.md'],
    },
  };
};

const mockDetectar = vi.fn(async () => gerarArquetipoBase());

vi.mock('../../src/nucleo/inquisidor.js', () => {
  return {
    iniciarInquisicao: vi.fn(async () => ({
      fileEntries: [{ relPath: 'src/a.ts', content: 'a' }],
    })),
    executarInquisicao: vi.fn(async () => ({
      ocorrencias: [
        {
          tipo: 'ARQUETIPO_TEST',
          relPath: 'src/a.ts',
          mensagem: 'Teste de arquétipo',
          nivel: 'aviso',
        },
      ],
      metricas: {
        totalArquivos: 1,
        tempoAnaliseMs: 10,
        tempoParsingMs: 5,
        cacheAstHits: 0,
        cacheAstMiss: 1,
        analistas: [],
      },
    })),
    registrarUltimasMetricas: vi.fn(),
    tecnicas: [],
    prepararComAst: vi.fn(async (fes) => fes.map((f: any) => ({ ...f, ast: {} }))),
  };
});
vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: async () => {
    const base = await mockDetectar();
    return { ...base, candidatos: base.melhores };
  },
}));
vi.mock('../../src/relatorios/relatorio-estrutura.js', () => ({
  gerarRelatorioEstrutura: () => undefined,
}));
vi.mock('../../src/relatorios/relatorio-zelador-saude.js', () => ({
  exibirRelatorioZeladorSaude: () => undefined,
}));
vi.mock('../../src/relatorios/relatorio-padroes-uso.js', () => ({
  exibirRelatorioPadroesUso: () => undefined,
}));
vi.mock('../../src/relatorios/conselheiro-oracular.js', () => ({
  emitirConselhoOracular: () => undefined,
}));
vi.mock('../../src/relatorios/gerador-relatorio.js', () => ({
  gerarRelatorioMarkdown: () => undefined,
}));
vi.mock('../../src/analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));
vi.mock('../../src/arquitetos/analista-estrutura.js', () => ({ alinhamentoEstrutural: () => [] }));
vi.mock('../../src/arquitetos/diagnostico-projeto.js', () => ({
  diagnosticarProjeto: () => undefined,
}));

describe('comandoDiagnosticar arquetipos branches extra', () => {
  const origLogInfo = log.info;
  const origLogAviso = log.aviso;
  const captInfo: string[] = [];
  const captAviso: string[] = [];
  beforeEach(() => {
    captInfo.length = 0;
    captAviso.length = 0;
    (log as any).info = (m: string) => captInfo.push(m);
    (log as any).aviso = (m: string) => captAviso.push(m);
    (log as any).infoDestaque = (m: string) => captInfo.push(m);
    (log as any).imprimirBloco = (titulo: string, linhas: string[]) => {
      captInfo.push(titulo);
      captInfo.push(...linhas);
    };
    arquetiposMode = 'movimentos';
    // Garante logs detalhados para todos os branches
    config.VERBOSE = true;
  });
  afterAll(() => {
    (log as any).info = origLogInfo;
    (log as any).aviso = origLogAviso;
  });

  it('cobre branches: forbidden, anomalias truncadas, planoSugestao preview & conflitos, drift com listas truncadas', async () => {
    const cmd = comandoDiagnosticar(() => {});
    await cmd.parseAsync(['node', 'oraculo', 'diagnosticar']);
    const joined = captInfo.concat(captAviso).join('\n');
    expect(joined).toMatch(/arquétipos candidatos/i);
    // forbiddenPresent pode gerar linha de diretórios proibidos apenas em modo verbose; validamos demais sinais
    // Deve mostrar preview top3 moves
    expect(joined).toMatch(/planoSugestao: 5 move/);
    expect(joined).toMatch(/conflitos: 2/);
    // Linha de truncamento de anomalias
    expect(joined).toMatch(/anomalia/); // verifica pelo menos uma anomalia listada
    // Drift com novos e removidos
    expect(joined).toMatch(/drift: arquétipo/);
  });

  it('cobre branch: planoSugestao sem moves', async () => {
    arquetiposMode = 'nenhum';
    const cmd = comandoDiagnosticar(() => {});
    await cmd.parseAsync(['node', 'oraculo', 'diagnosticar']);
    const joined = captInfo.join('\n');
    expect(joined).toMatch(/planoSugestao: nenhum move sugerido/);
  });
});
