import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';

// Mock do scanRepository para controlar o fileMap
let __BASE_DIR_FANTASMA__ = '';
vi.mock('../nucleo/scanner.js', () => ({
  scanRepository: vi.fn(async (_base: string) => {
    const base = __BASE_DIR_FANTASMA__;
    return {
      'src/antigo.ts': {
        relPath: 'src/antigo.ts',
        fullPath: path.join(base, 'src/antigo.ts'),
        content: '',
      },
      'src/recente.ts': {
        relPath: 'src/recente.ts',
        fullPath: path.join(base, 'src/recente.ts'),
        content: '',
      },
      'src/referenciado.ts': {
        relPath: 'src/referenciado.ts',
        fullPath: path.join(base, 'src/referenciado.ts'),
        content: '',
      },
    };
  }),
}));

// grafoDependencias real é importado de detector-dependencias; aqui sobrepomos após import.
import { grafoDependencias } from '../analistas/detector-dependencias.js';
import { detectarFantasmas } from './fantasma.js';

describe('detectarFantasmas (heurística segura)', () => {
  let baseDir: string;
  const dias = 86_400_000;

  beforeEach(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-fantasma-'));
    __BASE_DIR_FANTASMA__ = baseDir;
    await fs.mkdir(path.join(baseDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(baseDir, 'src/antigo.ts'), '');
    await fs.writeFile(path.join(baseDir, 'src/recente.ts'), '');
    await fs.writeFile(path.join(baseDir, 'src/referenciado.ts'), '');
    // Manipula mtimes: antigo > 50 dias, recente = agora
    const antigoTime = Date.now() - 50 * dias;
    await fs.utimes(path.join(baseDir, 'src/antigo.ts'), antigoTime / 1000, antigoTime / 1000);
  });

  it('marca apenas arquivo não referenciado e antigo como fantasma', async () => {
    grafoDependencias.clear();
    // Marca referenciado.ts como dependência de algum arquivo
    grafoDependencias.set('src/outro.ts', new Set(['src/referenciado.ts']));

    const { fantasmas } = await detectarFantasmas(baseDir);
    const nomes = fantasmas.map((f) => f.arquivo);
    expect(nomes).toContain('src/antigo.ts'); // antigo e não referenciado
    expect(nomes).not.toContain('src/recente.ts'); // recente
    expect(nomes).not.toContain('src/referenciado.ts'); // referenciado
  });
});
