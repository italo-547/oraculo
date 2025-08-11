import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitirConselhoOracular } from './conselheiro-oracular.js';

let log: any;
beforeEach(async () => {
  vi.resetModules();
  vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
      aviso: vi.fn(),
    },
  }));
  log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('emitirConselhoOracular', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não emite conselho se não for madrugada nem muitos arquivos', () => {
    emitirConselhoOracular({ hora: 14, arquivosParaCorrigir: 1, arquivosParaPodar: 1 });
    expect(log.aviso).not.toHaveBeenCalled();
  });

  it('emite conselho se for madrugada', () => {
    emitirConselhoOracular({ hora: 23 });
    expect(log.aviso).toHaveBeenCalled();
    expect(log.aviso.mock.calls[0][0]).toMatch(/só por um instante/);
    expect(log.aviso.mock.calls[1][0]).toMatch(/passa das 23h/);
  });

  it('emite conselho se for muitos arquivos para corrigir', () => {
    emitirConselhoOracular({ hora: 10, arquivosParaCorrigir: 100 });
    expect(log.aviso).toHaveBeenCalled();
    expect(log.aviso.mock.calls[1][0]).toMatch(/volume de tarefas/);
  });

  it('emite conselho se for muitos arquivos para podar', () => {
    emitirConselhoOracular({ hora: 10, arquivosParaPodar: 100 });
    expect(log.aviso).toHaveBeenCalled();
    expect(log.aviso.mock.calls[1][0]).toMatch(/volume de tarefas/);
  });

  it('emite conselho se for madrugada e muitos arquivos', () => {
    emitirConselhoOracular({ hora: 2, arquivosParaCorrigir: 100 });
    expect(log.aviso).toHaveBeenCalled();
    expect(log.aviso.mock.calls[1][0]).toMatch(/passa das 2h/);
    expect(log.aviso.mock.calls[2][0]).toMatch(/volume de tarefas/);
  });
});
