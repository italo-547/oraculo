// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import type { ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';

describe('orquestrador-arquetipos – ramos adicionais', () => {
  it('apenas penalidades: desempata por missingRequired quando ratio e forb empatam', async () => {
    vi.resetModules();
    // detectores vazios para cair no fallback de candidatos fornecidos pelo mock do pontuador
    vi.mock('./detectores/detector-node.js', () => ({ detectarArquetipoNode: () => [] }));
    vi.mock('./detectores/detector-java.js', () => ({ detectarArquetipoJava: () => [] }));
    vi.mock('./detectores/detector-kotlin.js', () => ({ detectarArquetipoKotlin: () => [] }));
    vi.mock('./detectores/detector-xml.js', () => ({ detectarArquetipoXML: () => [] }));
    vi.mock('./deteccao/pontuador.js', () => ({
      pontuarTodos: () => [
        {
          nome: 'monorepo-packages',
          score: 0,
          confidence: 0,
          matchedRequired: [],
          missingRequired: ['a', 'b', 'c'],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: ['src', 'pages'], // 2/4 => 0.5
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: '',
          descricao: '',
        },
        {
          nome: 'monorepo-packages',
          score: 0,
          confidence: 0,
          matchedRequired: [],
          missingRequired: ['a'],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: ['src', 'pages'], // 2/4 => 0.5
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: '',
          descricao: '',
        },
      ],
    }));
    const { detectarArquetipo } = await import('./orquestrador-arquetipos.js');
    const r = detectarArquetipo(['only-forbidden-tie']);
    // Deve escolher o que tem maior missingRequired (3 vs 1)
    expect(r.missingRequired?.length).toBe(3);
  });
});
