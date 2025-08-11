import { describe, it, expect, vi } from 'vitest';
import { ritualComando } from './ritual-comando.js';

vi.mock('../nucleo/constelacao/traverse.js', () => ({
    traverse: (node: any, visitors: any) => {
        // Simula um comando válido
        if (node.type === 'File') {
            visitors.enter({
                node: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'onCommand' },
                    arguments: [null, { type: 'FunctionDeclaration', body: { type: 'BlockStatement' } }],
                },
            });
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
    it('extractHandlerInfo retorna null para node não função', async () => {
        const { extractHandlerInfo } = await import('./ritual-comando.js');
        expect(extractHandlerInfo({ type: 'Literal', value: 42 } as any)).toBeNull();
    });

    it('extractHandlerInfo cobre FunctionExpression e ArrowFunctionExpression', async () => {
        const { extractHandlerInfo } = await import('./ritual-comando.js');
        const funcExpr = { type: 'FunctionExpression', body: { type: 'BlockStatement' } };
        const arrowFunc = { type: 'ArrowFunctionExpression', body: { type: 'BlockStatement' } };
        const resultFunc = extractHandlerInfo(funcExpr as any);
        const resultArrow = extractHandlerInfo(arrowFunc as any);
        expect(resultFunc && resultFunc.func).toEqual(funcExpr);
        expect(resultFunc && resultFunc.bodyBlock).toEqual(funcExpr.body);
        expect(resultArrow && resultArrow.func).toEqual(arrowFunc);
        expect(resultArrow && resultArrow.bodyBlock).toEqual(arrowFunc.body);
    });
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

    it('retorna padrao-ausente se não houver comando', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                // Não chama enter
            },
        }));
        const { ritualComando } = await import('./ritual-comando.js');
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias.length).toBe(1);
            expect(ocorrencias[0].tipo).toBe('padrao-ausente');
        }
    });

    it('test cobre arquivos com e sem bot', () => {
        expect(ritualComando.test('meubot.js')).toBe(true);
        expect(ritualComando.test('outro-arquivo.js')).toBe(false);
    });

    it('detecta comando válido com FunctionExpression', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({
                    node: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'onCommand' },
                        arguments: [null, { type: 'FunctionExpression', body: { type: 'BlockStatement' } }],
                    },
                });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(0);
    });

    it('detecta comando válido com ArrowFunctionExpression', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({
                    node: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'registerCommand' },
                        arguments: [
                            null,
                            { type: 'ArrowFunctionExpression', body: { type: 'BlockStatement' } },
                        ],
                    },
                });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias)).toBe(true);
        expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(0);
    });

    it('ignora handler inválido (sem bloco)', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({
                    node: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'onCommand' },
                        arguments: [null, { type: 'FunctionDeclaration', body: { type: 'NotBlock' } }],
                    },
                });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias.length).toBe(0);
        } else {
            expect(ocorrencias == null).toBe(true);
        }
    });

    it('ignora node que não é CallExpression', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({ node: { type: 'Literal', value: 42 } });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias.length).toBe(0);
        } else {
            expect(ocorrencias == null).toBe(true);
        }
    });

    it('ignora CallExpression cujo callee não é Identifier', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({
                    node: { type: 'CallExpression', callee: { type: 'Literal', value: 42 }, arguments: [] },
                });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias.length).toBe(0);
        } else {
            expect(ocorrencias == null).toBe(true);
        }
    });

    it('ignora comando com handler ausente', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({
                    node: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'onCommand' },
                        arguments: [null],
                    },
                });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias.length).toBe(0);
        } else {
            expect(ocorrencias == null).toBe(true);
        }
    });

    it('ignora comando com handler que não é função', () => {
        vi.doMock('../nucleo/constelacao/traverse.js', () => ({
            traverse: (node: any, visitors: any) => {
                visitors.enter({
                    node: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'onCommand' },
                        arguments: [null, { type: 'Literal', value: 42 }],
                    },
                });
            },
        }));
        const fakeAst = { node: { type: 'File' } };
        const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias.length).toBe(0);
        } else {
            expect(ocorrencias == null).toBe(true);
        }
    });
});
