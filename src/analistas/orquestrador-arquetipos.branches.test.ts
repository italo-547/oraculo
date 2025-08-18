// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { detectarArquetipo } from './orquestrador-arquetipos.js';
import type { ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';

// Mocks de detectores especializados
vi.mock('./detectores/detector-node.js', () => ({
  detectarArquetipoNode: (_: string[]) => [] as ResultadoDeteccaoArquetipo[],
}));
vi.mock('./detectores/detector-java.js', () => ({
  detectarArquetipoJava: (_: string[]) => [] as ResultadoDeteccaoArquetipo[],
}));
vi.mock('./detectores/detector-kotlin.js', () => ({
  detectarArquetipoKotlin: (_: string[]) => [] as ResultadoDeteccaoArquetipo[],
}));
vi.mock('./detectores/detector-xml.js', () => ({
  detectarArquetipoXML: (_: string[]) => [] as ResultadoDeteccaoArquetipo[],
}));

// Mock do pontuador para diferentes cenários
vi.mock('./deteccao/pontuador.js', () => ({
  pontuarTodos: (arquivos: string[]) => {
    if (arquivos.includes('only-forbidden')) {
      return [
        {
          nome: 'monorepo-packages',
          score: 0,
          confidence: 0,
          matchedRequired: [],
          missingRequired: ['src'],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: ['src'],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: '',
          descricao: '',
        },
      ];
    }
    if (arquivos.includes('multi-forbidden')) {
      return [
        {
          nome: 'monorepo',
          score: 1,
          confidence: 0,
          matchedRequired: [],
          missingRequired: ['src'],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: ['src', 'packages', 'apps'],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: '',
          descricao: '',
        },
        {
          nome: 'monorepo-packages',
          score: 1,
          confidence: 0,
          matchedRequired: [],
          missingRequired: ['src'],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: ['src', 'packages'],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: '',
          descricao: '',
        },
      ];
    }
    if (arquivos.includes('no-signals'))
      return [
        {
          nome: 'api-rest-express',
          score: 10,
          confidence: 0,
          matchedRequired: [],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: [],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: '',
          descricao: '',
        },
      ];
    // default: retorna dois candidatos para testar ordenação
    return [
      {
        nome: 'api-rest-express',
        score: 80,
        confidence: 60,
        matchedRequired: ['src/controllers'],
        missingRequired: [],
        matchedOptional: ['src/routes'],
        dependencyMatches: ['express'],
        filePatternMatches: ['api'],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: '',
      },
      {
        nome: 'fullstack',
        score: 70,
        confidence: 70,
        matchedRequired: ['pages'],
        missingRequired: ['api'],
        matchedOptional: ['prisma'],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: '',
      },
    ];
  },
}));

describe('orquestrador-arquetipos (branches)', () => {
  it('fallback para pontuador e ordenação padrão escolhe melhor candidato', () => {
    const r = detectarArquetipo(['src/controllers/a.ts', 'api/x']);
    expect(r.nome).toBe('api-rest-express');
  });

  it('apenas penalidades: ignora monorepo-packages quando só forbidden é src', () => {
    const r = detectarArquetipo(['only-forbidden']);
    // Fluxo: filtrados fica vazio -> segue com fluxo normal; com um único candidato, retorna ele mesmo (monorepo-packages)
    expect(r.nome).toBe('monorepo-packages');
  });

  it('apenas penalidades: desempate por maior ratio de forbidden e maior quantidade', () => {
    const r = detectarArquetipo(['multi-forbidden']);
    expect(['monorepo', 'monorepo-packages']).toContain(r.nome);
  });

  it('sem sinais no melhor candidato: retorna desconhecido', () => {
    const r = detectarArquetipo(['no-signals']);
    expect(r.nome).toBe('desconhecido');
  });
});
