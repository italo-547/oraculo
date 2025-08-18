// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { detectarArquetipos } from './detector-arquetipos.js';
import type { SnapshotEstruturaBaseline } from '../tipos/tipos.js';

// Helpers de mock para persistência
vi.mock('../zeladores/util/persistencia.js', async (orig) => {
  const mod = await orig<any>();
  let saved: any = undefined;
  return {
    ...mod,
    lerEstado: vi.fn(async (_p: string) => saved ?? []),
    salvarEstado: vi.fn(async (_p: string, dados: any) => {
      saved = dados;
    }),
  };
});

// Mocka OperarioEstrutura para cobrir catch silencioso
vi.mock('../zeladores/operario-estrutura.js', async () => ({
  OperarioEstrutura: {
    planejar: vi.fn(async () => {
      throw new Error('falha-planejar');
    }),
  },
}));

// Garante que o orquestrador retorne desconhecido para acionar o fallback de baseline
vi.mock('./orquestrador-arquetipos.js', async () => ({
  detectarArquetipo: (arquivos: string[]) => ({
    nome: 'desconhecido',
    score: 0,
    confidence: 0,
    matchedRequired: [],
    missingRequired: [],
    matchedOptional: [],
    dependencyMatches: [],
    filePatternMatches: [],
    forbiddenPresent: [],
    anomalias: [],
    descricao: 'mock',
  }),
}));

describe('detectarArquetipos — baseline e falhas no planejar', () => {
  const baseDir = path.resolve('.');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('quando desconhecido com baseline existente e interseção, retorna baseline', async () => {
    // Ajusta o mock para retornar baseline existente
    const { lerEstado } = await import('../zeladores/util/persistencia.js');
    const baseline: SnapshotEstruturaBaseline = {
      version: 1,
      timestamp: new Date().toISOString(),
      arquetipo: 'api-rest-express',
      confidence: 77,
      arquivosRaiz: ['package.json', 'tsconfig.json'],
    };
    (lerEstado as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(baseline);

    const arquivos = [
      { relPath: 'package.json', fullPath: 'package.json', content: null, ast: undefined },
      { relPath: 'docs/readme.txt', fullPath: 'docs/readme.txt', content: null, ast: undefined },
    ];
    const resultado = await detectarArquetipos({ arquivos, baseDir }, baseDir);
    expect(resultado.melhores[0].nome).toBe('api-rest-express');
    expect(resultado.melhores[0].explicacaoSimilaridade).toMatch(/baseline existente/);
  });

  it('cria baseline quando inexistente e melhores[0] presente', async () => {
    const { lerEstado, salvarEstado } = await import('../zeladores/util/persistencia.js');
    (lerEstado as any).mockResolvedValueOnce([]);
    const arquivos = [
      {
        relPath: 'src/controllers/a.ts',
        fullPath: 'src/controllers/a.ts',
        content: null,
        ast: undefined,
      },
      { relPath: 'api/hello.ts', fullPath: 'api/hello.ts', content: null, ast: undefined },
    ];
    const resultado = await detectarArquetipos({ arquivos, baseDir }, baseDir);
    expect(resultado.baseline).toBeDefined();
    expect((salvarEstado as any).mock.calls.length).toBeGreaterThan(0);
  });

  it('falha no OperarioEstrutura.planejar é tratada silenciosamente', async () => {
    const arquivos = [
      { relPath: 'src/index.ts', fullPath: 'src/index.ts', content: null, ast: undefined },
    ];
    const resultado = await detectarArquetipos({ arquivos, baseDir }, baseDir);
    // Deve retornar normalmente, sem lançar
    expect(resultado.melhores[0]).toBeDefined();
  });
});
