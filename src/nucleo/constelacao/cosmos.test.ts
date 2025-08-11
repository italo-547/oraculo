import { describe, it, expect } from 'vitest';
import { config } from './cosmos.js';

describe('config (cosmos)', () => {
    it('deve exportar um objeto config', () => {
        expect(typeof config).toBe('object');
        expect(config).toHaveProperty('DEV_MODE');
        expect(config).toHaveProperty('GUARDIAN_BASELINE');
        expect(config).toHaveProperty('ORACULO_STATE_DIR');
        expect(config).toHaveProperty('SCANNER_EXTENSOES_COM_AST');
        expect(Array.isArray(config.SCANNER_EXTENSOES_COM_AST)).toBe(true);
    });

    it('DEV_MODE deve refletir variáveis de ambiente', () => {
        // Não altera o process.env real, só valida o valor atual
        expect(typeof config.DEV_MODE).toBe('boolean');
    });

    it('ORACULO_STATE_DIR e ZELADOR_STATE_DIR devem ser iguais', () => {
        expect(config.ORACULO_STATE_DIR).toBe(config.ZELADOR_STATE_DIR);
    });
});
