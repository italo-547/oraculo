import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('detectorDependencias (extra)', () => {
  it('detecta import circular simples (arquivo importa a si mesmo)', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        // Import relativo que normaliza para o próprio arquivo
        visitors.ImportDeclaration({ node: { source: { value: './self.js' } } });
      },
    }));
    await vi.doMock('node:path', () => {
      const mockPath = {
        normalize: (p: string) => p.replace(/\\/g, '/').replace(/\/\.\//g, '/'),
        join: (...args: string[]) => args.join('/'),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
      };
      return { ...mockPath, default: mockPath };
    });
    const { detectorDependencias } = await import('./detector-dependencias.js');
    const fakeAst = { node: { type: 'File' } };
    const relPath = 'src/self.js';
    const contexto = { arquivos: [{ relPath: 'src/self.js', ast: fakeAst }] } as any;
    const ocorrencias = detectorDependencias.aplicar('', relPath, fakeAst as any, '', contexto);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.mensagem?.includes('Importação circular')),
    ).toBe(true);
  });

  it('gera aviso de uso misto import/require', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.ImportDeclaration({ node: { source: { value: 'lib-a' } } });
        visitors.CallExpression({
          node: {
            callee: { type: 'Identifier', name: 'require' },
            arguments: [{ type: 'StringLiteral', value: 'lib-b' }],
          },
        });
      },
    }));
    await vi.doMock('node:path', () => {
      const mockPath = {
        normalize: (p: string) => p.replace(/\\/g, '/'),
        join: (...args: string[]) => args.join('/'),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
      };
      return { ...mockPath, default: mockPath };
    });
    const { detectorDependencias } = await import('./detector-dependencias.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = detectorDependencias.aplicar(
      '',
      'src/misto.js',
      fakeAst as any,
      '',
      undefined,
    );
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.mensagem?.includes('Uso misto de require e import')),
    ).toBe(true);
  });
});
