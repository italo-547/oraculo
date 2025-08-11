import { describe, it, expect } from 'vitest';
import * as constantes from './constantes.js';

describe('constantes', () => {
    it('deve exportar as constantes reais', () => {
        expect(constantes).toHaveProperty('BASELINE_PATH');
        expect(constantes).toHaveProperty('REGISTRO_VIGIA_CAMINHO_PADRAO');
        expect(constantes).toHaveProperty('ALGORITMO_HASH');
    });
});
