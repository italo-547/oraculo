import { describe, it, expect, vi } from 'vitest';

// Cobre branch faltante em vigiaOculta: skip quando content vazio ou só espaços
vi.mock('./registros.js', () => ({
  carregarRegistros: vi.fn().mockResolvedValue([{ arquivo: 'a', hash: 'hash_' }]),
  salvarRegistros: vi.fn(),
}));
vi.mock('./hash.js', () => ({
  gerarSnapshotDoConteudo: vi.fn(() => 'hash_'),
}));
vi.mock('./constantes.js', () => ({ REGISTRO_VIGIA_CAMINHO_PADRAO: '/tmp/v.json' }));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { aviso: vi.fn(), info: vi.fn(), sucesso: vi.fn() },
}));

import { vigiaOculta } from './vigiaOculto.js';

describe('vigiaOculta branches', () => {
  it('ignora arquivos sem relPath ou content vazio/whitespace', async () => {
    const { log } = await import('../nucleo/constelacao/log.js');
    await vigiaOculta(
      [
        { relPath: '', content: 'abc', fullPath: '/x' } as any,
        { relPath: 'a', content: '   ', fullPath: '/a' } as any,
        { relPath: 'a', content: '', fullPath: '/a2' } as any,
        { relPath: 'a', content: null, fullPath: '/a3' } as any,
      ] as any,
      '/tmp/v.json',
      true,
    );
    expect(log.aviso).not.toHaveBeenCalled();
    expect(log.sucesso).not.toHaveBeenCalled();
  });
});
