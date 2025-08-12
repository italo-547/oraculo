import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { iniciarInquisicao } from './inquisidor.js';
import { config } from './constelacao/cosmos.js';

// Mock scanner para controlar ordem inicial
vi.mock('./scanner.js', () => ({
  scanRepository: vi.fn(async () => ({
    'docs/readme.md': {
      relPath: 'docs/readme.md',
      fullPath: path.resolve('docs/readme.md'),
      content: '',
    },
    'src/a.ts': { relPath: 'src/a.ts', fullPath: path.resolve('src/a.ts'), content: '' },
    'src/b.ts': { relPath: 'src/b.ts', fullPath: path.resolve('src/b.ts'), content: '' },
  })),
}));

describe('priorização ignora meta no topo', () => {
  const incPath = path.resolve('.oraculo/incremental-test.json');
  it('empurra docs/readme.md para o final', async () => {
    await fs.mkdir(path.dirname(incPath), { recursive: true });
    await fs.writeFile(
      incPath,
      JSON.stringify({
        arquivos: {
          'docs/readme.md': {
            hash: 'x',
            ocorrencias: [],
            analistas: { demo: { ocorrencias: 10, duracaoMs: 500 } },
          },
          'src/a.ts': {
            hash: 'y',
            ocorrencias: [],
            analistas: { demo: { ocorrencias: 1, duracaoMs: 10 } },
          },
          'src/b.ts': {
            hash: 'z',
            ocorrencias: [],
            analistas: { demo: { ocorrencias: 2, duracaoMs: 20 } },
          },
        },
      }),
    );
    config.ANALISE_PRIORIZACAO_ENABLED = true;
    config.ANALISE_INCREMENTAL_STATE_PATH = incPath;
    const resultado = await iniciarInquisicao(process.cwd(), {
      incluirMetadados: false,
      skipExec: true,
    });
    const ordem = resultado.fileEntries.map((f) => f.relPath);
    // docs/readme.md teria score maior, mas deve aparecer por último
    expect(ordem[0]).toMatch(/^src\//);
    expect(ordem[ordem.length - 1]).toBe('docs/readme.md');
  });
});
