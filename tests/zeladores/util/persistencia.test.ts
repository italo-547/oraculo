// SPDX-License-Identifier: MIT
import { describe, it, expect, afterEach } from 'vitest';
import {
  lerEstado,
  salvarEstado,
  salvarEstadoAtomico,
  lerArquivoTexto,
} from '../../src/zeladores/util/persistencia.js';
import { promises as fs } from 'node:fs';

const TEST_FILE = './tmp-test-persistencia.json';
const TEST_FILE_ATOMICO = './tmp-test-persistencia-atomico.json';
const TEST_FILE_TEXTO = './tmp-test-arquivo.txt';

afterEach(async () => {
  for (const f of [TEST_FILE, TEST_FILE_ATOMICO, TEST_FILE_TEXTO, TEST_FILE + '-inexistente']) {
    try {
      await fs.unlink(f);
    } catch {}
  }
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

  it('retorna array vazio se JSON inválido', async () => {
    await fs.writeFile(TEST_FILE, '{invalido', 'utf-8');
    const lido = await lerEstado(TEST_FILE);
    expect(Array.isArray(lido)).toBe(true);
  });

  it('salva estado atomicamente', async () => {
    const dados = { a: 1 };
    await salvarEstadoAtomico(TEST_FILE_ATOMICO, dados);
    const lido = await lerEstado<typeof dados>(TEST_FILE_ATOMICO);
    expect(lido).toEqual(dados);
  });

  it('lê arquivo texto bruto', async () => {
    await fs.writeFile(TEST_FILE_TEXTO, 'linhaX', 'utf-8');
    const conteudo = await lerArquivoTexto(TEST_FILE_TEXTO);
    expect(conteudo).toBe('linhaX');
  });

  it('lerArquivoTexto retorna vazio se inexistente', async () => {
    const conteudo = await lerArquivoTexto(TEST_FILE_TEXTO + '-nao');
    expect(conteudo).toBe('');
  });
});
