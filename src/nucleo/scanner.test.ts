import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanRepository } from './scanner.js';

// Mocks
const fakeDirent = (name: string, isDir: boolean = false) => ({
  name,
  isDirectory: () => isDir,
  isSymbolicLink: () => false,
});

it('ordena arquivos por nome (cobre sort)', async () => {
  vi.resetModules();
  const { scanRepository } = await import('./scanner.js');
  const { promises } = await import('node:fs');
  (promises.readdir as any).mockResolvedValueOnce([
    fakeDirent('zeta.txt'),
    fakeDirent('alpha.txt'),
    fakeDirent('beta.txt'),
  ]);
  (promises.stat as any).mockImplementation(async (file: string) => ({
    mtimeMs: 1,
    isDirectory: () => false,
    isSymbolicLink: () => false,
  }));
  const fileMap = await scanRepository('/base');
  const keys = Object.keys(fileMap);
  // Deve conter todos os arquivos
  expect(keys).toEqual(['alpha.txt', 'beta.txt', 'zeta.txt']);
});

it('não lê conteúdo quando includeContent é false', async () => {
  vi.resetModules();
  const { scanRepository } = await import('./scanner.js');
  const { promises } = await import('node:fs');
  (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
  (promises.stat as any).mockResolvedValueOnce({
    mtimeMs: 123,
    isDirectory: () => false,
    isSymbolicLink: () => false,
  });
  // Garante que lerEstado não será chamado
  const persist = await import('../zeladores/util/persistencia.js');
  const lerEstadoSpy = vi.spyOn(persist, 'lerEstado');
  const fileMap = await scanRepository('/base', { includeContent: false });
  expect(Object.keys(fileMap)).toContain('a.txt');
  expect(fileMap['a.txt'].content).toBeNull();
  expect(lerEstadoSpy).not.toHaveBeenCalled();
});

it('cobre erro em lerEstado (catch de arquivo)', async () => {
  vi.resetModules();
  const { scanRepository } = await import('./scanner.js');
  const { promises } = await import('node:fs');
  (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
  (promises.stat as any).mockResolvedValueOnce({
    mtimeMs: 123,
    isDirectory: () => false,
    isSymbolicLink: () => false,
  });
  // Simula erro em lerEstado
  const persist = await import('../zeladores/util/persistencia.js');
  vi.spyOn(persist, 'lerEstado').mockRejectedValueOnce(new Error('erro lerEstado'));
  const onProgress = vi.fn();
  const fileMap = await scanRepository('/base', { onProgress });
  // Agora mantemos o arquivo no mapa mas com content null; onProgress registra o erro
  expect(Object.keys(fileMap)).toContain('a.txt');
  expect(fileMap['a.txt'].content).toBeNull();
  expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('erro lerEstado'));
});

it('lança erro se stat retornar indefinido', async () => {
  vi.resetModules();
  const { scanRepository } = await import('./scanner.js');
  const { promises } = await import('node:fs');
  (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
  (promises.stat as any).mockResolvedValueOnce(undefined);
  const onProgress = vi.fn();
  const fileMap = await scanRepository('/base', { onProgress });
  expect(Object.keys(fileMap)).toHaveLength(0);
  expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('Stat indefinido'));
});

it('não recursiona em diretório simbólico (apenas adiciona o symlink ao fileMap)', async () => {
  vi.resetModules();
  const { scanRepository } = await import('./scanner.js');
  const { promises } = await import('node:fs');
  const persist = await import('../zeladores/util/persistencia.js');
  (promises.readdir as any).mockResolvedValueOnce([
    { name: 'symlinkDir', isDirectory: () => true, isSymbolicLink: () => true },
  ]);
  (promises.stat as any).mockResolvedValueOnce({
    mtimeMs: 1,
    isDirectory: () => true,
    isSymbolicLink: () => true,
  });
  vi.spyOn(persist, 'lerEstado').mockResolvedValueOnce('conteudo_symlink');
  const onProgress = vi.fn();
  const fileMap = await scanRepository('/base', { onProgress });
  // Deve conter apenas o symlink, sem recursão
  expect(Object.keys(fileMap)).toEqual(['symlinkDir']);
  expect(fileMap['symlinkDir'].content).toBe('conteudo_symlink');
  const progressCalls = onProgress.mock.calls.flat();
  expect(progressCalls.some((msg: string) => String(msg).includes('symlinkDir'))).toBe(true);
});

vi.mock('micromatch', () => ({
  default: { isMatch: () => false },
  isMatch: () => false,
}));
vi.mock('../zeladores/util/persistencia.js', () => ({
  lerEstado: vi.fn(async (file) => 'conteudo_' + file),
}));
vi.mock('node:fs', () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));
vi.mock('path', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...(typeof mod === 'object' && mod !== null ? mod : {}),
    join: (...args: string[]) => args.join('/'),
    relative: (from: string, to: string) => to.replace(from + '/', ''),
    dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '/',
  };
});
vi.mock('../nucleo/constelacao/cosmos.js', () => ({
  config: { ZELADOR_IGNORE_PATTERNS: [], CLI_INCLUDE_PATTERNS: [], CLI_EXCLUDE_PATTERNS: [] },
}));

describe('scanRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('varre diretórios e retorna fileMap com conteúdo', async () => {
    const { promises } = await import('node:fs');
    // Simula estrutura: /base/a.txt, /base/dir/b.js
    (promises.readdir as any)
      .mockImplementationOnce(async () => [fakeDirent('a.txt'), fakeDirent('dir', true)])
      .mockImplementationOnce(async () => [fakeDirent('b.js')]);
    (promises.stat as any).mockImplementation(async (file: string) => ({
      mtimeMs: 123,
      isDirectory: () => file.endsWith('dir'),
      isSymbolicLink: () => false,
    }));
    const fileMap = await scanRepository('/base');
    // Normaliza os caminhos para garantir compatibilidade cross-plataforma
    const fileKeys = Object.keys(fileMap).map((k) => k.replace(/\\/g, '/'));
    expect(fileKeys).toEqual(['a.txt', 'dir/b.js']);
    // Normaliza o conteúdo para garantir compatibilidade cross-plataforma
    const aFile = fileMap['a.txt'];
    // Aceita tanto 'dir/b.js' quanto 'dir\\b.js' como chave
    const bFile = fileMap['dir/b.js'] ?? fileMap['dir\\b.js'];
    expect(aFile).toBeDefined();
    expect(bFile).toBeDefined();
    if (aFile && bFile && aFile.content && bFile.content) {
      expect(aFile.content.replace(/\\/g, '/')).toBe('conteudo_/base/a.txt');
      expect(bFile.content.replace(/\\/g, '/')).toBe('conteudo_/base/dir/b.js');
    }
    expect(fileMap['a.txt'].ultimaModificacao).toBe(123);
  });

  it('cobre erro em fs.readdir (catch de diretório)', async () => {
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockRejectedValueOnce(new Error('erro readdir'));
    const onProgress = vi.fn();
    const fileMap = await scanRepository('/fail', { onProgress });
    expect(Object.keys(fileMap)).toHaveLength(0);
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('erro readdir'));
  });

  it('cobre erro em fs.stat (catch de arquivo)', async () => {
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
    (promises.stat as any).mockRejectedValueOnce(new Error('erro stat'));
    const onProgress = vi.fn();
    const fileMap = await scanRepository('/fail2', { onProgress });
    expect(Object.keys(fileMap)).toHaveLength(0);
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('erro stat'));
  });

  it('ignora arquivos pelo padrão micromatch (ignores default)', async () => {
    vi.resetModules();
    const isMatch = () => true;
    vi.doMock('micromatch', () => ({ default: { isMatch }, isMatch }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
    const fileMap = await scanRepository('/base');
    expect(Object.keys(fileMap)).toHaveLength(0);
  });

  it('inclui somente padrões quando CLI_INCLUDE_PATTERNS definido', async () => {
    vi.resetModules();
    // Mock dedicado de micromatch para comportamento determinístico neste cenário
    vi.doMock('micromatch', () => ({
      default: { isMatch: (str: string, patterns: string[]) => patterns.some((p) => p === str) },
      isMatch: (str: string, patterns: string[]) => patterns.some((p) => p === str),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: ['*.txt'],
        CLI_INCLUDE_PATTERNS: ['a.txt'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt'), fakeDirent('b.txt')]);
    (promises.stat as any).mockResolvedValue(async () => ({
      mtimeMs: 1,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    }));
    const fileMap = await scanRepository('/base');
    // Com include ativo, apenas arquivos que casem algum include são considerados, ignorando ignores padrão.
    // 'a.txt' casa; 'b.txt' não casa e deve ser filtrado.
    expect(Object.keys(fileMap)).toEqual(['a.txt']);
  });

  it('exclui padrões adicionais em CLI_EXCLUDE_PATTERNS', async () => {
    vi.resetModules();
    // Mock dedicado de micromatch para exclusão por igualdade simples
    vi.doMock('micromatch', () => ({
      default: { isMatch: (str: string, patterns: string[]) => patterns.some((p) => p === str) },
      isMatch: (str: string, patterns: string[]) => patterns.some((p) => p === str),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: [],
        CLI_EXCLUDE_PATTERNS: ['b.txt'],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt'), fakeDirent('b.txt')]);
    (promises.stat as any).mockResolvedValue(async () => ({
      mtimeMs: 1,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    }));
    const fileMap = await scanRepository('/base');
    // Exclude deve remover b.txt
    expect(Object.keys(fileMap)).toEqual(['a.txt']);
  });

  it('restringe varredura a roots derivados dos padrões de include (não lê baseDir)', async () => {
    vi.resetModules();
    // Micromatch simples: caso especial para pattern 'dir/**'
    vi.doMock('micromatch', () => ({
      default: {
        isMatch: (str: string, patterns: string[]) =>
          Array.isArray(patterns) && patterns.some((p) => p === 'dir/**' && str.startsWith('dir/')),
      },
      isMatch: (str: string, patterns: string[]) =>
        Array.isArray(patterns) && patterns.some((p) => p === 'dir/**' && str.startsWith('dir/')),
    }));
    // Config com include ativo
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        ZELADOR_IGNORE_PATTERNS: [],
        CLI_INCLUDE_PATTERNS: ['dir/**'],
        CLI_EXCLUDE_PATTERNS: [],
      },
    }));
    const { scanRepository } = await import('./scanner.js');
    const { promises } = await import('node:fs');
    const calls: string[] = [];
    (promises.readdir as any).mockImplementation(async (p: string) => {
      calls.push(p);
      if (p === '/base/dir') return [fakeDirent('a.txt')];
      // Se tentar ler a raiz baseDir, falharia; o teste garante que não é chamado
      if (p === '/base') throw new Error('should-not-read-base');
      return [];
    });
    (promises.stat as any).mockResolvedValue(async () => ({
      mtimeMs: 1,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    }));
    const fileMap = await scanRepository('/base');
    const keys = Object.keys(fileMap)
      .map((k) => k.replace(/\\/g, '/'))
      .sort();
    expect(keys).toEqual(['dir/a.txt']);
    // Verifica que não tentou ler '/base' (somente o root inferido)
    expect(calls.includes('/base')).toBe(false);
    expect(calls.includes('/base/dir')).toBe(true);
  }, 15000);
  it('ignora arquivos pelo filtro customizado', async () => {
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
    const fileMap = await scanRepository('/base', { filter: () => false });
    expect(Object.keys(fileMap)).toHaveLength(0);
  });

  it('chama onProgress customizado para sucesso', async () => {
    const { promises } = await import('node:fs');
    (promises.readdir as any).mockResolvedValueOnce([fakeDirent('a.txt')]);
    (promises.stat as any).mockResolvedValueOnce({
      mtimeMs: 123,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    });
    const onProgress = vi.fn();
    await scanRepository('/base', { onProgress });
    const progressCalls = onProgress.mock.calls.flat();
    expect(
      progressCalls.some((msg: string) => String(msg).includes('✅ Arquivo lido: a.txt')),
    ).toBe(true);
  });
});
