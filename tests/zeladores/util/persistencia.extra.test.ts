// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lerEstado, salvarEstado } from '../../src/zeladores/util/persistencia.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmpBase = path.join(os.tmpdir(), 'oraculo-persistencia-tests');

async function limpar(caminho: string) {
  try {
    await fs.rm(caminho, { recursive: true, force: true });
  } catch {}
}

describe('persistencia util', () => {
  beforeEach(async () => {
    await limpar(tmpBase);
    await fs.mkdir(tmpBase, { recursive: true });
  });
  afterEach(async () => {
    await limpar(tmpBase);
  });

  it('lerEstado retorna [] para arquivo inexistente', async () => {
    const resultado = await lerEstado<any>(path.join(tmpBase, 'nao-existe.json'));
    expect(Array.isArray(resultado)).toBe(true);
    expect(resultado).toEqual([]);
  });

  it('salvarEstado escreve objeto e lerEstado recupera', async () => {
    const arquivo = path.join(tmpBase, 'estado.json');
    const dados = { a: 1, b: 'teste' };
    await salvarEstado(arquivo, dados);
    const lido = await lerEstado<typeof dados>(arquivo);
    expect(lido).toEqual(dados);
  });

  it('salvarEstado aceita string pura', async () => {
    const arquivo = path.join(tmpBase, 'raw.txt');
    const texto = 'conteudo cru';
    await salvarEstado(arquivo, texto);
    const lidoBruto = await fs.readFile(arquivo, 'utf-8');
    expect(lidoBruto).toBe(texto);
  });

  it('lerEstado retorna [] se JSON inválido', async () => {
    const arquivo = path.join(tmpBase, 'invalido.json');
    await fs.writeFile(arquivo, '{ json ruim', 'utf-8');
    const resultado = await lerEstado<any>(arquivo);
    expect(resultado).toEqual([]);
  });
});
