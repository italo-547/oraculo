import { describe, it, expect, vi } from 'vitest';
import { detectorEstrutura, sinaisDetectados } from './detector-estrutura.js';

vi.mock('./detector-dependencias.js', () => ({ grafoDependencias: new Map([['express', new Set()]]) }));

describe('detectorEstrutura', () => {
    it('detecta monorepo e fullstack e popula sinaisDetectados', () => {
        const contexto = {
            arquivos: [
                { relPath: 'src/pages/index.ts' },
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
    });

    it('retorna [] se contexto não for fornecido', () => {
        expect(detectorEstrutura.aplicar('', '', undefined, '', undefined)).toEqual([]);
    });
});
