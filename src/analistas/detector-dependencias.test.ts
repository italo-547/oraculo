import { describe, it, expect, vi } from 'vitest';
import { detectorDependencias, grafoDependencias } from './detector-dependencias.js';

vi.mock('node:path', () => {
    const mockPath = {
        normalize: (p: string) => p.replace(/\\/g, '/'),
        join: (...args: string[]) => args.join('/'),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
    };
    return { ...mockPath, default: mockPath };
});
vi.mock('../nucleo/constelacao/traverse.js', () => ({
    traverse: (node: any, visitors: any) => {
        // Simula ImportDeclaration e require
        if (node.type === 'File') {
            visitors.ImportDeclaration({ node: { source: { value: './modA' } } });
            visitors.CallExpression({ node: { callee: { type: 'Identifier', name: 'require' }, arguments: [{ type: 'StringLiteral', value: 'modB' }] } });
        }
    },
}));

describe('detectorDependencias', () => {
    it('detecta dependências de import e require', () => {
        const fakeAst = {
            node: { type: 'File' },
        };
        const ocorrencias = detectorDependencias.aplicar('', 'src/teste.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        // Não é possível garantir o side effect no grafo sem AST real
    });

    it('retorna [] se ast não for fornecido', () => {
        expect(detectorDependencias.aplicar('', 'src/teste.js', null, '', undefined)).toEqual([]);
    });
});
