import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analistaPadroesUso, estatisticasUsoGlobal } from './analista-padroes-uso.js';

vi.mock('../nucleo/constelacao/traverse.js', () => ({
    traverse: (ast: any, visitors: any) => {
        // Simula um arquivo com const, require e export
        if (ast.type === 'File') {
            visitors.enter({ node: { type: 'VariableDeclaration', kind: 'const' } });
            visitors.enter({ node: { type: 'CallExpression', callee: { type: 'Identifier', name: 'require' }, arguments: [{ type: 'StringLiteral', value: 'mod' }] } });
            visitors.enter({ node: { type: 'ExportNamedDeclaration' } });
        }
    },
}));


beforeEach(() => {
    estatisticasUsoGlobal.requires = {};
    estatisticasUsoGlobal.consts = {};
    estatisticasUsoGlobal.exports = {};
    vi.resetModules();
});

describe('analistaPadroesUso', () => {
    it('acumula estatísticas de uso de const, require e export', () => {
        const contexto = {
            arquivos: [
                { ast: { type: 'File' } },
            ],
        };
        const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
        expect(ocorrencias).toEqual([]);
        expect(estatisticasUsoGlobal.consts.const).toBe(1);
        expect(estatisticasUsoGlobal.requires.require).toBe(1);
        expect(estatisticasUsoGlobal.exports.export).toBe(1);
    });

    it('test retorna true para .js e .ts, false para outros', () => {
        expect(analistaPadroesUso.test('foo.js')).toBe(true);
        expect(analistaPadroesUso.test('foo.ts')).toBe(true);
        expect(analistaPadroesUso.test('foo.txt')).toBe(false);
    });

    it('ignora arquivo sem ast', () => {
        const contexto = { arquivos: [{ ast: null }] };
        const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
        expect(ocorrencias).toEqual([]);
    });

    it('ignora nodes não relevantes', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (ast: any, visitors: any) => {
                // node irrelevante
                visitors.enter({ node: { type: 'Literal' } });
            },
        }));
        const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
        const contexto = { arquivos: [{ ast: { type: 'File' } }] };
        const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
        expect(ocorrencias).toEqual([]);
        expect(estatisticasUsoGlobal.consts.const).toBeUndefined();
        expect(estatisticasUsoGlobal.requires.require).toBeUndefined();
        expect(estatisticasUsoGlobal.exports.export).toBeUndefined();
    });

    it('acumula export default e named', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (ast: any, visitors: any) => {
                visitors.enter({ node: { type: 'ExportDefaultDeclaration' } });
                visitors.enter({ node: { type: 'ExportNamedDeclaration' } });
            },
        }));
        const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
        const contexto = { arquivos: [{ ast: { type: 'File' } }] };
        analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
        expect(estatisticasUsoGlobal.exports.export).toBe(2);
    });

    it('não acumula require se callee não for Identifier', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (ast: any, visitors: any) => {
                visitors.enter({ node: { type: 'CallExpression', callee: { type: 'Literal', value: 'require' } } });
            },
        }));
        const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
        const contexto = { arquivos: [{ ast: { type: 'File' } }] };
        analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
        expect(estatisticasUsoGlobal.requires.require).toBeUndefined();
    });

    it('não acumula const se não for const', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (ast: any, visitors: any) => {
                visitors.enter({ node: { type: 'VariableDeclaration', kind: 'let' } });
            },
        }));
        const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
        const contexto = { arquivos: [{ ast: { type: 'File' } }] };
        analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
        expect(estatisticasUsoGlobal.consts.const).toBeUndefined();
    });

    it('retorna null se contexto não for fornecido', () => {
        expect(analistaPadroesUso.aplicar('', 'teste.js', undefined, '', undefined)).toBeNull();
    });
});
