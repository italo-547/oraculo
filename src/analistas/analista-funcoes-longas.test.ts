import { describe, it, expect, vi } from 'vitest';
import { analistaFuncoesLongas } from './analista-funcoes-longas.js';

vi.mock('../nucleo/constelacao/traverse.js', () => ({
    traverse: (node: any, visitors: any) => {
        // Simula chamada para FunctionDeclaration com função longa
        if (node.type === 'File' && node.body && node.body[0]?.type === 'FunctionDeclaration') {
            visitors.FunctionDeclaration({ node: node.body[0] });
        }
    },
}));

describe('analistaFuncoesLongas', () => {
    it('detecta função longa', () => {
        const fakeAst = {
            node: {
                type: 'File',
                body: [
                    {
                        type: 'FunctionDeclaration',
                        loc: { start: { line: 1 }, end: { line: 40 } },
                    },
                ],
            },
        };
        const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', fakeAst as any, '', undefined);
        expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(1);
        if (Array.isArray(ocorrencias)) {
            expect(ocorrencias[0].tipo).toBe('FUNCAO_LONGA');
        }
    });

    it('ignora função curta', () => {
        const fakeAst = {
            node: {
                type: 'File',
                body: [
                    {
                        type: 'FunctionDeclaration',
                        loc: { start: { line: 1 }, end: { line: 10 } },
                    },
                ],
            },
        };
        const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', fakeAst as any, '', undefined);
        expect(ocorrencias).toHaveLength(0);
    });
});
