// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach } from 'vitest';
import type { ArquetipoEstruturaDef, ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';
import { grafoDependencias } from './detector-dependencias.js';
import './detector-arquetipos.js';

function callScore(def: ArquetipoEstruturaDef, arquivos: string[]): ResultadoDeteccaoArquetipo {
  const fx = (
    globalThis as unknown as {
      __ORACULO_TESTS__?: {
        scoreArquetipo?: (d: ArquetipoEstruturaDef, a: string[]) => ResultadoDeteccaoArquetipo;
      };
    }
  ).__ORACULO_TESTS__?.scoreArquetipo as
    | ((d: ArquetipoEstruturaDef, a: string[]) => ResultadoDeteccaoArquetipo)
    | undefined;
  if (!fx) throw new Error('scoreArquetipo não exposto para testes');
  return fx(def, arquivos);
}

describe('scoreArquetipo — explicações e reforços adicionais', () => {
  beforeEach(() => {
    grafoDependencias.clear();
  });

  it('api-rest-express: explicação para score >= 100 (padrão oficial)', () => {
    grafoDependencias.set('pkg', new Set(['express']));
    const def: ArquetipoEstruturaDef = {
      nome: 'api-rest-express',
      pesoBase: 4, // 40 pontos
      requiredDirs: ['src/controllers'],
      optionalDirs: ['src/routes'],
      dependencyHints: ['express'],
      filePresencePatterns: ['rest'],
      descricao: 'API Express',
    } as any;
    const r = callScore(def, [
      'src/controllers/user.ts',
      'notes/api-guidelines.md',
      'docs/rest.http',
    ]);
    expect(r.explicacaoSimilaridade).toMatch(/padrão oficial api-rest-express/i);
  });

  it('api-rest-express: explicação para 70 <= score < 100 (assemelha fortemente)', () => {
    grafoDependencias.clear();
    const def: ArquetipoEstruturaDef = {
      nome: 'api-rest-express',
      pesoBase: 4, // 40
      requiredDirs: ['src/controllers'],
      filePresencePatterns: ['api'],
    } as any;
    // controllers presentes, sem express
    const r = callScore(def, ['src/controllers/user.ts', 'docs/api-readme.md']);
    expect(r.explicacaoSimilaridade).toMatch(/assemelha fortemente/i);
  });

  it('api-rest-express: explicação para 40 <= score < 70 (parcialmente compatível)', () => {
    grafoDependencias.set('pkg', new Set(['express']));
    const def: ArquetipoEstruturaDef = {
      nome: 'api-rest-express',
      pesoBase: 2, // 20
      dependencyHints: ['express'],
    } as any;
    const r = callScore(def, ['src/index.ts']); // sem api/rest em caminho
    expect(r.explicacaoSimilaridade).toMatch(/parcialmente compatível/i);
  });

  it('api-rest-express: explicação para score < 40 (personalizada/próximo)', () => {
    const def: ArquetipoEstruturaDef = { nome: 'api-rest-express', pesoBase: 1 } as any; // 10
    const r = callScore(def, ['src/index.ts']);
    expect(r.explicacaoSimilaridade).toMatch(/padrão mais próximo/i);
  });

  it('api-rest-express: reforço híbrido quando tem pages e prisma (sem api)', () => {
    grafoDependencias.set('x', new Set(['express']));
    const def: ArquetipoEstruturaDef = { nome: 'api-rest-express' } as any;
    const r = callScore(def, ['pages/home.tsx', 'prisma/schema.prisma']);
    expect(r.explicacaoSimilaridade).toMatch(/híbrida/i);
    expect(r.explicacaoSimilaridade).toMatch(/Outros candidatos potenciais/i);
  });

  it('fullstack: explicação para pages/api/prisma sem backend express/controllers (parcial)', () => {
    const def: ArquetipoEstruturaDef = {
      nome: 'fullstack',
      requiredDirs: ['pages', 'api', 'prisma'],
    } as any;
    const r = callScore(def, ['pages/home.tsx', 'api/hello.ts', 'prisma/schema.prisma']);
    expect(r.candidatoExtra).toBeUndefined();
    expect(r.explicacaoSimilaridade).toMatch(/fullstack/);
    expect(r.explicacaoSimilaridade).toMatch(/Outros candidatos potenciais/i);
  });
});
