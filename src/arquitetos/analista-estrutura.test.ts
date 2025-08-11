import { describe, it, expect, vi } from 'vitest';
import { alinhamentoEstrutural } from './analista-estrutura.js';

vi.mock('node:path', () => {
    const path = require('path');
    path.sep = '/';
    return { ...path, default: path };
});
vi.mock('p-limit', () => ({ default: (n: number) => (fn: any) => fn() }));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));

describe('alinhamentoEstrutural', () => {
    it('retorna ideal nulo se não houver match', async () => {
        const arquivos = [
            { relPath: 'outro/sem-match.ts' },
        ];
        const resultado = await alinhamentoEstrutural(arquivos as any, '/base');
        expect(resultado[0].ideal).toBeNull();
    });
});
