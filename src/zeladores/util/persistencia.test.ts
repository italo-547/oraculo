import { describe, it, expect, afterEach } from 'vitest';
import { lerEstado, salvarEstado } from './persistencia.js';
import { promises as fs } from 'node:fs';

const TEST_FILE = './tmp-test-persistencia.json';

afterEach(async () => {
  try {
    await fs.unlink(TEST_FILE);
  } catch {}
});

describe('persistencia helpers', () => {
  it('salva e lê um objeto JSON corretamente', async () => {
    const dados = { foo: 'bar', n: 42 };
    await salvarEstado(TEST_FILE, dados);
    const lido = await lerEstado<typeof dados>(TEST_FILE);
    expect(lido).toEqual(dados);
  });

  it('retorna array vazio se arquivo não existe', async () => {
    const lido = await lerEstado<{ foo: string }[]>(TEST_FILE + '-inexistente');
    expect(Array.isArray(lido)).toBe(true);
    expect(lido.length).toBe(0);
  });
});
