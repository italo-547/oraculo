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

    it('retorna null se contexto não for fornecido', () => {
        expect(analistaPadroesUso.aplicar('', 'teste.js', undefined, '', undefined)).toBeNull();
    });
});
