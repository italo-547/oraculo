import { lerEstado, salvarEstado } from '../../src/zeladores/util/persistencia';
import fs from 'node:fs/promises';

describe('persistencia helpers', () => {
  const caminhoTeste = './tests/tmp/teste-estado.json';
  const dadosTeste = { valor: 123, texto: 'Teste' };

  afterAll(async () => {
    await fs.rm('./tests/tmp', { recursive: true, force: true });
  });

  it('salva e lê estado corretamente', async () => {
    await salvarEstado(caminhoTeste, dadosTeste);
    const lido = await lerEstado<typeof dadosTeste>(caminhoTeste);
    expect(lido).toEqual(dadosTeste);
  });

  it('lerEstado retorna array vazio em arquivo inexistente', async () => {
    const lido = await lerEstado('./tests/tmp/inexistente.json');
    expect(Array.isArray(lido)).toBe(true);
    expect(lido).toHaveLength(0);
  });
});
// ...existing code from exemplos-testes-implementacoes/tests/utils/persistencia.spec.ts...
