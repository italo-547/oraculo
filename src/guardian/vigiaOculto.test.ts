import { describe, it, expect } from 'vitest';
import { vigiaOculta } from './vigiaOculto.js';

describe('vigiaOculta', () => {
    it('deve ser uma função', () => {
        expect(typeof vigiaOculta).toBe('function');
    });

    it('executa sem lançar erro (mock básico)', async () => {
        // Chamada genérica, pois não sabemos a assinatura exata
        await expect(vigiaOculta([], './__mock__.json', false)).resolves.toBeUndefined();
    });
});
