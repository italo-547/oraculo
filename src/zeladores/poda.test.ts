import { describe, it, expect } from 'vitest';
import { removerArquivosOrfaos } from './poda.js';

describe('removerArquivosOrfaos', () => {
    it('retorna objeto com arquivosOrfaos (mock)', async () => {
        // Como detectarFantasmas depende do filesystem, aqui só testamos a estrutura do retorno
        const resultado = await removerArquivosOrfaos([]);
        expect(resultado).toHaveProperty('arquivosOrfaos');
        expect(Array.isArray(resultado.arquivosOrfaos)).toBe(true);
    });
});
