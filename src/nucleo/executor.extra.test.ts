// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarInquisicao } from './executor.js';

vi.mock('./constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    erro: vi.fn(),
    sucesso: vi.fn(),
  },
}));

// Após o mock acima, import ESM para obter objeto mockado
import * as logMod from './constelacao/log.js';
const { log } = logMod as any;

describe('executarInquisicao (extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('modo verbose: loga sucesso de técnica global e análise de arquivo', async () => {
    const globalAplicar = vi.fn().mockResolvedValue({
      tipo: 'info',
      nivel: 'info',
      mensagem: 'ok',
      relPath: '',
      arquivo: '',
      linha: 0,
    });
    const fileAplicar = vi.fn().mockResolvedValue([]);
    await executarInquisicao(
      [{ relPath: 'file1.js', content: 'c1', fullPath: '/f1', ast: null as any }],
      [
        { nome: 'globalX', global: true, aplicar: globalAplicar },
        { nome: 'fileX', global: false, aplicar: fileAplicar },
      ] as any,
      '/base',
      {},
      { verbose: true },
    );
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Técnica global'));
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("'fileX' analisou file1.js"));
  });

  it('modo verbose: loga stack em erro global e de arquivo', async () => {
    const err1 = new Error('g-fail');
    err1.stack = 'STACK_G';
    const err2 = new Error('f-fail');
    err2.stack = 'STACK_F';
    const resultado = await executarInquisicao(
      [{ relPath: 'file.js', content: 'c', fullPath: '/f', ast: null as any }],
      [
        { nome: 'gErr', global: true, aplicar: vi.fn().mockRejectedValue(err1) },
        { nome: 'fErr', global: false, test: () => true, aplicar: vi.fn().mockRejectedValue(err2) },
      ] as any,
      '/base',
      {},
      { verbose: true },
    );
    // Deve haver 2 ocorrências de ERRO_ANALISTA (global + arquivo)
    expect(resultado.ocorrencias.filter((o) => o.tipo === 'ERRO_ANALISTA')).toHaveLength(2);
    // stack logs
    expect(log.info).toHaveBeenCalledWith('STACK_G');
    expect(log.info).toHaveBeenCalledWith('STACK_F');
  });

  it('modo compact: loga apenas ao final', async () => {
    await executarInquisicao(
      [
        { relPath: 'a.js', content: '', fullPath: '/a', ast: null as any },
        { relPath: 'b.js', content: '', fullPath: '/b', ast: null as any },
        { relPath: 'c.js', content: '', fullPath: '/c', ast: null as any },
      ],
      [],
      '/base',
      {},
      { compact: true },
    );
    // Deve existir uma única chamada info com frase final
    const infos = (log.info as any).mock.calls.map((c: any[]) => c[0]);
    expect(infos.filter((m: string) => /Arquivos analisados: 3/.test(m))).toHaveLength(1);
    // Nenhuma chamada de progresso intermediário
    expect(infos.length).toBe(1);
  });

  it('não executa técnica se test retorna false', async () => {
    const aplicarMock = vi.fn();
    await executarInquisicao(
      [{ relPath: 'ok.js', content: '', fullPath: '/a', ast: null as any }],
      [{ nome: 'skipTest', global: false, test: () => false, aplicar: aplicarMock }] as any,
      '/base',
      {},
    );
    expect(aplicarMock).not.toHaveBeenCalled();
  });

  it('executa técnica por arquivo em modo verbose com test true', async () => {
    const aplicarMock = vi.fn().mockResolvedValue(undefined);
    await executarInquisicao(
      [{ relPath: 'ok.js', content: 'code', fullPath: '/a', ast: null as any }],
      [{ nome: 'withTest', global: false, test: () => true, aplicar: aplicarMock }] as any,
      '/base',
      {},
      { verbose: true },
    );
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("'withTest' analisou ok.js"));
  });
});
