import { describe, it, expect, vi } from 'vitest';
import { ritualComando } from './ritual-comando.js';

vi.mock('../nucleo/constelacao/traverse.js', () => ({
    traverse: (node: any, visitors: any) => {
        // Simula um comando válido
        if (node.type === 'File') {
            visitors.enter({ node: { type: 'CallExpression', callee: { type: 'Identifier', name: 'onCommand' }, arguments: [null, { type: 'FunctionDeclaration', body: { type: 'BlockStatement' } }] } });
        }
    },
}));
vi.mock('@babel/types', () => ({
    isCallExpression: (n: any) => n.type === 'CallExpression',
    isIdentifier: (n: any) => n.type === 'Identifier',
    isFunctionDeclaration: (n: any) => n.type === 'FunctionDeclaration',
    isFunctionExpression: (n: any) => n.type === 'FunctionExpression',
    isArrowFunctionExpression: (n: any) => n.type === 'ArrowFunctionExpression',
    isBlockStatement: (n: any) => n.type === 'BlockStatement',
}));

describe('ritualComando', () => {
    it('detecta comando válido', () => {
        const fakeAst = {
            node: { type: 'File' },
        };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(0);
    });

    it('retorna erro se ast não for fornecido', () => {
        const ocorrencias = ritualComando.aplicar('', 'bot.js', null, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias[0].tipo).toBe('erro');
        }
    });
});
