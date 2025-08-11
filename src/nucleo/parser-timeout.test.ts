import { describe, it, expect, vi } from 'vitest';

vi.mock('./constelacao/log.js', () => ({
    log: { debug: vi.fn() },
}));



describe('parser timeout', () => {
    it('retorna null se timeout vencer antes do parser', async () => {
        const { decifrarSintaxe, PARSERS } = await import('./parser.js');
        const { log } = await import('./constelacao/log.js');
        // Salva o parser original
        const original = PARSERS.get('.js');
        // Mocka o parser para ser lento
        PARSERS.set('.js', () => new Promise((resolve) => setTimeout(() => resolve({ type: 'File' }), 50)) as any);
        const result = await decifrarSintaxe('const x = 1;', '.js', { timeoutMs: 10 });
        expect(result).toBeNull();
        expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('timeout'));
        // Restaura o parser original
        PARSERS.set('.js', original!);
    });
});
