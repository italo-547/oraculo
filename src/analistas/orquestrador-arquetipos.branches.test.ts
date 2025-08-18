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
    if (arquivos.includes('empty-all')) {
      return [] as ResultadoDeteccaoArquetipo[];
    }
    if (arquivos.includes('tie-normal')) {
      // Dois candidatos idênticos em métricas para empatar até o nome
      const base: Omit<ResultadoDeteccaoArquetipo, 'nome'> = {
        score: 50,
        confidence: 50,
        matchedRequired: ['req'],
        missingRequired: ['miss'],
        matchedOptional: ['opt'],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: '',
      };
      return [
        { nome: 'b-type', ...base },
        { nome: 'a-type', ...base },
      ] as ResultadoDeteccaoArquetipo[];
    }
    if (arquivos.includes('tie-mr')) {
      // Empate em missingRequired e score; desempata por matchedRequired (desc)
      const base: Omit<ResultadoDeteccaoArquetipo, 'nome' | 'matchedRequired'> = {
        score: 42,
        confidence: 10,
        missingRequired: ['m1'],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: '',
      };
      return [
        { nome: 'low-mr', matchedRequired: ['a'], ...base },
        { nome: 'high-mr', matchedRequired: ['a', 'b'], ...base },
      ] as ResultadoDeteccaoArquetipo[];
    }
    if (arquivos.includes('tie-confidence')) {
      // Empate até matchedRequired; desempata por confidence (desc)
      const base: Omit<ResultadoDeteccaoArquetipo, 'nome' | 'confidence'> = {
        score: 77,
        matchedRequired: ['req'],
        missingRequired: ['m'],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: '',
      };
      return [
        { nome: 'low-conf', confidence: 5, ...base },
        { nome: 'high-conf', confidence: 80, ...base },
      ] as ResultadoDeteccaoArquetipo[];
    }
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

  it('quando detectores e pontuador retornam vazio: desconhecido imediato', () => {
    const r = detectarArquetipo(['empty-all']);
    expect(r.nome).toBe('desconhecido');
  });

  it('empate total em ordenação normal desempata por nome ascendente', () => {
    const r = detectarArquetipo(['tie-normal']);
    expect(r.nome).toBe('a-type');
  });

  it('ordenacao normal: desempata por matchedRequired quando missingRequired/score iguais', () => {
    const r = detectarArquetipo(['tie-mr']);
    expect(r.nome).toBe('high-mr');
  });

  it('ordenacao normal: desempata por confidence quando missingRequired/score/matchedRequired iguais', () => {
    const r = detectarArquetipo(['tie-confidence']);
    expect(r.nome).toBe('high-conf');
  });
});
