import { describe, it, expect } from 'vitest';
import { iniciarInquisicao } from '../../src/nucleo/inquisidor.js';

describe('nucleo/inquisidor branches', () => {
  it('iniciarInquisicao com skipExec e sem metadados retorna resultado sem executar tecnicas', async () => {
    const res = await iniciarInquisicao(process.cwd(), {
      includeContent: false,
      incluirMetadados: false,
      skipExec: true,
    });
    expect(res).toHaveProperty('totalArquivos');
    expect(Array.isArray(res.arquivosAnalisados)).toBe(true);
  });
});
