import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectorEstrutura, sinaisDetectados } from './detector-estrutura.js';

vi.mock('./detector-dependencias.js', () => ({
  grafoDependencias: new Map([['express', new Set()]]),
}));

describe('detectorEstrutura', () => {
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
});
