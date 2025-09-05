// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ArquetipoEstruturaDef,
  ResultadoDeteccaoArquetipo,
  ArquetipoDeteccaoAnomalia,
} from '../tipos/tipos.js';
import { grafoDependencias } from '../../src/analistas/detector-dependencias.js';
// Importa o módulo alvo para garantir que a função interna seja exposta em __ORACULO_TESTS__
import '../../src/analistas/detector-arquetipos.js';

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

describe('scoreArquetipo – cobertura total de caminhos', () => {
  beforeEach(() => {
    grafoDependencias.clear();
  });

  it('api-rest-express: reforços por controllers/express, padrões de arquivo e sugestoes', () => {
    grafoDependencias.set('pkg', new Set(['express']));
    const def: ArquetipoEstruturaDef = {
      nome: 'api-rest-express',
      pesoBase: 2,
      requiredDirs: ['src/controllers'],
      optionalDirs: ['src/routes'],
      dependencyHints: ['express'],
      filePresencePatterns: ['rest'],
      rootFilesAllowed: ['README.md'],
      descricao: 'API Express',
    } as any;
    const r = callScore(def, ['src/controllers/user.ts', 'docs/rest-client.http', 'api/readme']);
    expect(r.nome).toBe('api-rest-express');
    expect(r.matchedRequired).toContain('src/controllers');
    expect(r.dependencyMatches).toContain('express');
    expect(r.filePatternMatches.length).toBeGreaterThan(0);
    expect(typeof r.sugestaoPadronizacao).toBe('string');
    expect(r.score).toBeGreaterThan(0);
  });

  it('api-rest-express: faltas geram sugestoes e score não negativo', () => {
    const def: ArquetipoEstruturaDef = {
      nome: 'api-rest-express',
      pesoBase: 1,
      requiredDirs: ['src/controllers'],
      dependencyHints: ['express'],
    } as any;
    // sem controllers, sem express em deps; com arquivos de raiz para anomalias
    const r = callScore(def, ['index.ts']);
    expect(r.missingRequired).toContain('src/controllers');
    expect(r.anomalias.some((a: ArquetipoDeteccaoAnomalia) => a.path === 'index.ts')).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.sugestaoPadronizacao).toContain('src/controllers');
    expect(r.sugestaoPadronizacao).toContain('express');
    expect(r.sugestaoPadronizacao).toContain('api');
  });

  it('fullstack híbrido completo sugere candidato extra e reforça explicacao', () => {
    grafoDependencias.set('x', new Set(['express']));
    const def: ArquetipoEstruturaDef = {
      nome: 'fullstack',
      pesoBase: 1,
      requiredDirs: ['pages', 'api', 'prisma'],
    } as any;
    const r = callScore(def, [
      'pages/home.tsx',
      'api/hello.ts',
      'prisma/schema.prisma',
      'src/controllers/a.ts',
    ]);
    expect(r.candidatoExtra).toBe('api-rest-express');
    expect(r.explicacaoSimilaridade).toMatch(/híbrida/i);
  });

  it('api-rest-express reforçado por fullstack (pages/prisma/api)', () => {
    grafoDependencias.set('x', new Set(['express']));
    const def: ArquetipoEstruturaDef = {
      nome: 'api-rest-express',
      pesoBase: 1,
    } as any;
    const r = callScore(def, ['pages/home.tsx', 'prisma/schema.prisma', 'api/hello.ts']);
    expect(r.score).toBeGreaterThan(0);
    expect(r.explicacaoSimilaridade).toMatch(/híbrida/i);
  });

  it('penaliza forbiddenDirs e considera optional/required ausente/presente', () => {
    const def: ArquetipoEstruturaDef = {
      nome: 'X',
      pesoBase: 1,
      requiredDirs: ['req'],
      optionalDirs: ['opt'],
      forbiddenDirs: ['forb'],
      dependencyHints: ['dep1'],
      filePresencePatterns: ['.cfg'],
    } as any;
    grafoDependencias.set('x', new Set(['dep1']));
    const r = callScore(def, ['opt/a.ts', 'forb/x.js', 'a.cfg']);
    expect(r.matchedOptional).toContain('opt');
    expect(r.forbiddenPresent).toContain('forb');
    expect(r.missingRequired).toContain('req');
  });
});
