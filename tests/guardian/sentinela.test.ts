// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanSystemIntegrity, acceptNewBaseline } from '../../src/guardian/sentinela.js';

vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));
// Evita mock de path pois afeta módulos que usam path.join; apenas se precisarmos isolar dirname poderíamos stubar diretamente.
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    erro: vi.fn(),
    sucesso: vi.fn(),
    aviso: vi.fn(),
  },
}));
vi.mock('../../src/guardian/hash.js', () => ({
  gerarSnapshotDoConteudo: vi.fn((c: string) => 'hash_' + c),
}));
vi.mock('../../src/guardian/baseline.js', () => ({
  carregarBaseline: vi.fn(),
  salvarBaseline: vi.fn(),
}));
vi.mock('../../src/guardian/diff.js', () => ({
  diffSnapshots: vi.fn(() => []),
  verificarErros: vi.fn(() => []),
}));
vi.mock('../../src/guardian/constantes.js', () => ({
  BASELINE_PATH: '/tmp/baseline.json',
}));
vi.mock('../../src/tipos/tipos.js', async () => {
  const mod = await import('../../src/tipos/tipos.js');
  return {
    ...mod,
    IntegridadeStatus: {
      Ok: 'ok',
      Criado: 'criado',
      Aceito: 'aceito',
      AlteracoesDetectadas: 'alt',
    },
    GuardianError: class extends Error {
      constructor(msg: string) {
        super(msg);
      }
    },
  };
});

describe('scanSystemIntegrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria baseline inicial se não existir', async () => {
    const { carregarBaseline, salvarBaseline } = await import('../../src/guardian/baseline.js');
    (carregarBaseline as any).mockResolvedValue(null);
    const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
    const result = await scanSystemIntegrity(fileEntries);
    expect(result.status).toBe('criado');
    expect(salvarBaseline).toHaveBeenCalled();
  });

  it('aceita baseline se --aceitar', async () => {
    const { carregarBaseline, salvarBaseline } = await import('../../src/guardian/baseline.js');
    (carregarBaseline as any).mockResolvedValue({ a: 'hash_abc' });
    const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
    const origArgv = process.argv;
    process.argv = [...origArgv, '--aceitar'];
    const result = await scanSystemIntegrity(fileEntries);
    expect(result.status).toBe('aceito');
    expect(salvarBaseline).toHaveBeenCalled();
    process.argv = origArgv;
  });

  it('retorna ok se não houver erros', async () => {
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    (carregarBaseline as any).mockResolvedValue({ a: 'hash_abc' });
    const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
    const result = await scanSystemIntegrity(fileEntries);
    expect(result.status).toBe('ok');
  });

  it('retorna AlteracoesDetectadas e detalhes se houver diferenças e justDiff', async () => {
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const { diffSnapshots, verificarErros } = await import('../../src/guardian/diff.js');
    (carregarBaseline as any).mockResolvedValue({ a: 'hash_abc' });
    (diffSnapshots as any).mockReturnValue({ removidos: ['a'], adicionados: [], alterados: [] });
    (verificarErros as any).mockReturnValue(['erro1']);
    const fileEntries = [{ relPath: 'b', content: 'def', fullPath: '/tmp/b' }];
    const result = await scanSystemIntegrity(fileEntries, { justDiff: true });
    expect(result.status).toBe('alt');
    expect(result.detalhes).toEqual(['erro1']);
  });

  it('lança GuardianError se houver erros de integridade', async () => {
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const { diffSnapshots, verificarErros } = await import('../../src/guardian/diff.js');
    (carregarBaseline as any).mockResolvedValue({ a: 'hash_abc' });
    (diffSnapshots as any).mockReturnValue({ removidos: [], adicionados: [], alterados: ['a'] });
    (verificarErros as any).mockReturnValue(['erro_integridade']);
    const fileEntries = [{ relPath: 'a', content: 'def', fullPath: '/tmp/a' }];
    await expect(scanSystemIntegrity(fileEntries)).rejects.toThrow('erro_integridade');
  });

  it('loga aviso se erro ao carregar baseline', async () => {
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    (carregarBaseline as any).mockImplementation(() => {
      throw new Error('corrompido');
    });
    const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
    await scanSystemIntegrity(fileEntries);
    expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('corrompido'));
  });

  it('loga aviso se erro ao gerar hash de arquivo e lança erro de integridade', async () => {
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const { gerarSnapshotDoConteudo } = await import('../../src/guardian/hash.js');
    const { verificarErros } = await import('../../src/guardian/diff.js');
    (carregarBaseline as any).mockResolvedValue({});
    (gerarSnapshotDoConteudo as any).mockImplementation(() => {
      throw new Error('hashfail');
    });
    (verificarErros as any).mockReturnValue(['erro_integridade']);
    const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
    await expect(scanSystemIntegrity(fileEntries)).rejects.toThrow('erro_integridade');
    expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('hashfail'));
  });
});

describe('acceptNewBaseline', () => {
  it('salva novo baseline', async () => {
    const { salvarBaseline } = await import('../../src/guardian/baseline.js');
    const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
    await acceptNewBaseline(fileEntries);
    expect(salvarBaseline).toHaveBeenCalled();
  });
});
