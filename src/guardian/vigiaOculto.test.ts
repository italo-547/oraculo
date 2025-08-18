// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vigiaOculta } from './vigiaOculto.js';

vi.mock('./registros.js', () => ({
  carregarRegistros: vi.fn(),
  salvarRegistros: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./hash.js', () => ({
  gerarSnapshotDoConteudo: vi.fn((c: string) => 'hash_' + c),
}));
vi.mock('./constantes.js', () => ({
  REGISTRO_VIGIA_CAMINHO_PADRAO: '/tmp/vigia.json',
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    aviso: vi.fn(),
    info: vi.fn(),
    sucesso: vi.fn(),
  },
}));

describe('vigiaOculta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve ser uma função', () => {
    expect(typeof vigiaOculta).toBe('function');
  });

  it('executa sem lançar erro (mock básico)', async () => {
    const { carregarRegistros } = await import('./registros.js');
    (carregarRegistros as any).mockResolvedValue([]);
    await expect(vigiaOculta([], './__mock__.json', false)).resolves.toBeUndefined();
  });

  it('detecta arquivos corrompidos, loga e faz reset automático', async () => {
    const { carregarRegistros, salvarRegistros } = await import('./registros.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    (carregarRegistros as any).mockResolvedValue([
      { arquivo: 'a', hash: 'hash_abc' },
      { arquivo: 'b', hash: 'hash_def' },
    ]);
    const arquivos = [
      { relPath: 'a', content: 'abc', fullPath: '/tmp/a' },
      { relPath: 'b', content: 'diferente', fullPath: '/tmp/b' },
    ];
    await vigiaOculta(arquivos, '/tmp/vigia.json', true);
    expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('Altera'));
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('b'));
    expect(salvarRegistros).toHaveBeenCalledWith(arquivos, '/tmp/vigia.json');
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('recalibrados'));
  });

  it('detecta arquivos corrompidos, loga mas não faz reset se autoReset=false', async () => {
    const { carregarRegistros, salvarRegistros } = await import('./registros.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    (carregarRegistros as any).mockResolvedValue([
      { arquivo: 'a', hash: 'hash_abc' },
      { arquivo: 'b', hash: 'hash_def' },
    ]);
    const arquivos = [
      { relPath: 'a', content: 'abc', fullPath: '/tmp/a' },
      { relPath: 'b', content: 'diferente', fullPath: '/tmp/b' },
    ];
    await vigiaOculta(arquivos, '/tmp/vigia.json', false);
    expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('Altera'));
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('b'));
    expect(salvarRegistros).not.toHaveBeenCalled();
    expect(log.sucesso).not.toHaveBeenCalled();
  });

  it('não loga nada se não houver arquivos corrompidos', async () => {
    const { carregarRegistros, salvarRegistros } = await import('./registros.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    (carregarRegistros as any).mockResolvedValue([
      { arquivo: 'a', hash: 'hash_abc' },
      { arquivo: 'b', hash: 'hash_def' },
    ]);
    const arquivos = [
      { relPath: 'a', content: 'abc', fullPath: '/tmp/a' },
      { relPath: 'b', content: 'def', fullPath: '/tmp/b' },
    ];
    await vigiaOculta(arquivos, '/tmp/vigia.json', true);
    expect(log.aviso).not.toHaveBeenCalled();
    expect(log.info).not.toHaveBeenCalled();
    expect(salvarRegistros).not.toHaveBeenCalled();
    expect(log.sucesso).not.toHaveBeenCalled();
  });
});
