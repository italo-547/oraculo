import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({ promises: { mkdir: vi.fn(async () => undefined) } }));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('./hash.js', () => ({ gerarSnapshotDoConteudo: vi.fn((c: string) => 'h' + c) }));
vi.mock('./baseline.js', () => ({ carregarBaseline: vi.fn(), salvarBaseline: vi.fn() }));
vi.mock('./diff.js', () => ({ diffSnapshots: vi.fn(() => []), verificarErros: vi.fn(() => []) }));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/b.json' }));
vi.mock('../tipos/tipos.js', async () => {
  const mod = await import('../tipos/tipos.js');
  return {
    ...mod,
    IntegridadeStatus: {
      Ok: 'ok',
      Criado: 'criado',
      Aceito: 'aceito',
      AlteracoesDetectadas: 'alt',
    },
    GuardianError: class extends Error {
      constructor(m: string) {
        super(m);
      }
    },
  };
});

describe('sentinela branches suppressLogs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('baseline inicial com suppressLogs não emite log de criação', async () => {
    const { carregarBaseline } = await import('./baseline.js');
    (carregarBaseline as any).mockResolvedValue(null);
    const { scanSystemIntegrity } = await import('./sentinela.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    const r = await scanSystemIntegrity([{ relPath: 'a', content: '1', fullPath: '/a' }], {
      suppressLogs: true,
    });
    expect(r.status).toBe('criado');
    expect(log.info).not.toHaveBeenCalledWith(expect.stringContaining('baseline inicial'));
  });

  it('aceitar baseline com suppressLogs não emite log de aceito', async () => {
    const { carregarBaseline } = await import('./baseline.js');
    (carregarBaseline as any).mockResolvedValue({ a: 'h1' });
    const orig = process.argv;
    process.argv = [...orig, '--aceitar'];
    const { scanSystemIntegrity } = await import('./sentinela.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    const r = await scanSystemIntegrity([{ relPath: 'a', content: '1', fullPath: '/a' }], {
      suppressLogs: true,
    });
    expect(r.status).toBe('aceito');
    const infos = (log.info as any).mock.calls.flat().join('\n');
    expect(infos).not.toMatch(/baseline aceito/);
    process.argv = orig;
  });
});
