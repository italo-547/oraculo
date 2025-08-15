import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectorEstrutura, sinaisDetectados } from './detector-estrutura.js';

vi.mock('./detector-dependencias.js', () => ({
  grafoDependencias: new Map([['express', new Set()]]),
}));

describe('detectorEstrutura', () => {
  it('detecta monorepo incompleto (sem pasta packages/)', () => {
    const contexto = {
      arquivos: [{ relPath: 'turbo.json' }, { relPath: 'src/pages/index.ts' }],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'estrutura-monorepo-incompleto'),
    ).toBe(true);
  });

  it('detecta estrutura incompleta (pages/ sem api/)', () => {
    const contexto = {
      arquivos: [{ relPath: 'src/pages/index.ts' }, { relPath: 'src/components/Comp.tsx' }],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'estrutura-incompleta'),
    ).toBe(true);
  });

  it('detecta estrutura mista (src/ e packages/)', () => {
    const contexto = {
      arquivos: [
        { relPath: 'projeto/src/pages/index.ts' },
        { relPath: 'projeto/packages/mod1/index.ts' },
        { relPath: 'projeto/turbo.json' },
      ],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'estrutura-mista'),
    ).toBe(true);
  });

  it('detecta muitos arquivos na raiz', async () => {
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    const original = cosmos.config.ESTRUTURA_ARQUIVOS_RAIZ_MAX;
    cosmos.config.ESTRUTURA_ARQUIVOS_RAIZ_MAX = 10; // força limite baixo
    try {
      const arquivos = Array.from({ length: 20 }, (_, i) => ({ relPath: `arquivo${i}.js` }));
      const contexto = { arquivos };
      const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
      expect(
        Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'estrutura-suspeita'),
      ).toBe(true);
    } finally {
      cosmos.config.ESTRUTURA_ARQUIVOS_RAIZ_MAX = original;
    }
  });

  it('detecta sinais de backend', () => {
    const contexto = {
      arquivos: [
        { relPath: 'src/controllers/user.ts' },
        { relPath: 'prisma/schema.prisma' },
        { relPath: 'src/api/rota.ts' },
      ],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'estrutura-backend'),
    ).toBe(true);
  });

  it('detecta sinais de frontend', () => {
    const contexto = {
      arquivos: [{ relPath: 'src/components/Comp.tsx' }, { relPath: 'src/pages/index.ts' }],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'estrutura-frontend'),
    ).toBe(true);
  });
  beforeEach(() => {
    for (const k of Object.keys(sinaisDetectados)) delete (sinaisDetectados as any)[k];
  });

  it('detecta monorepo e fullstack e popula sinaisDetectados', () => {
    const contexto = {
      arquivos: [
        { relPath: '/src/pages/index.ts' }, // <-- agora com '/src/'
        { relPath: 'src/api/rota.ts' },
        { relPath: 'prisma/schema.prisma' },
        { relPath: 'packages/mod1/index.ts' },
        { relPath: 'src/controllers/user.ts' },
        { relPath: 'src/components/Comp.tsx' },
        { relPath: 'src/cli.ts' },
        { relPath: 'turbo.json' },
      ],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(Array.isArray(ocorrencias)).toBe(true);
    const tipos = Array.isArray(ocorrencias) ? ocorrencias.map((o: any) => o.tipo) : [];
    expect(tipos).toContain('estrutura-monorepo');
    expect(tipos).toContain('estrutura-fullstack');
    expect(sinaisDetectados.temPages).toBe(true);
    expect(sinaisDetectados.temApi).toBe(true);
    expect(sinaisDetectados.temPrisma).toBe(true);
    expect(sinaisDetectados.temPackages).toBe(true);
    expect(sinaisDetectados.temExpress).toBe(true);
    expect(sinaisDetectados.temControllers).toBe(true);
    expect(sinaisDetectados.temComponents).toBe(true);
    expect(sinaisDetectados.temCli).toBe(true);
    expect(sinaisDetectados.temSrc).toBe(true);
  });

  it('retorna [] se contexto não for fornecido', () => {
    expect(detectorEstrutura.aplicar('', '', undefined, '', undefined)).toEqual([]);
  });

  it('não retorna ocorrências se não for monorepo nem fullstack', () => {
    const contexto = {
      arquivos: [{ relPath: 'src/algumarquivo.ts' }, { relPath: 'src/maisum.ts' }],
    };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    expect(ocorrencias).toEqual([]);
    expect(sinaisDetectados.temPages).toBe(false);
    expect(sinaisDetectados.temApi).toBe(false);
    expect(sinaisDetectados.temPrisma).toBe(false);
    expect(sinaisDetectados.temPackages).toBe(false);
    expect(sinaisDetectados.temExpress).toBe(true); // pois o mock sempre tem express
  });

  it('test sempre retorna true', () => {
    expect(detectorEstrutura.test('qualquer-arquivo.ts')).toBe(true);
    expect(detectorEstrutura.test('outro.js')).toBe(true);
  });

  it('não gera estrutura-sem-src quando há muitos arquivos com caminhos Windows (backslashes) dentro de src', () => {
    // Simula projeto "grande": > 30 arquivos, todos dentro de src\ usando separador Windows
    const arquivos = Array.from({ length: 35 }, (_, i) => ({
      relPath: `src\\modulo\\arquivo${i}.ts`,
    }));
    const contexto = { arquivos };
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto as any);
    const tipos = Array.isArray(ocorrencias) ? ocorrencias.map((o: any) => o.tipo) : [];
    // Regressão: não deve marcar estrutura-sem-src pois temos src presente (mesmo com backslashes)
    expect(tipos).not.toContain('estrutura-sem-src');
  });
});
