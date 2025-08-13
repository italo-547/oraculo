import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';

// Mock de segurança para forçar AUTO_FIX true e PLUGINS vazio
vi.mock('../nucleo/constelacao/cosmos.js', () => ({
  config: {
    STRUCTURE_PLUGINS: [],
    STRUCTURE_AUTO_FIX: true,
    STRUCTURE_CONCURRENCY: 1,
    STRUCTURE_LAYERS: undefined,
  },
}));

import { corrigirEstrutura } from './corretor-estrutura.js';
import { log } from '../nucleo/constelacao/log.js';

const tmpDir = path.join(process.cwd(), 'tmp-corretor-destino-existe-test');

describe('corretor-estrutura destino existe branches', () => {
  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  it('log.erro quando destino já existe', async () => {
    const arquivo = 'src/a.js';
    const ideal = 'ideal';
    const atual = 'src';
    // cria origem e destino existente
    const origemAbs = path.join(tmpDir, arquivo);
    await fs.mkdir(path.dirname(origemAbs), { recursive: true });
    await fs.writeFile(origemAbs, 'console.log(1)');
    const destinoAbs = path.join(tmpDir, ideal, path.relative(atual, arquivo));
    await fs.mkdir(path.dirname(destinoAbs), { recursive: true });
    await fs.writeFile(destinoAbs, 'existe');

    const erroSpy = vi.spyOn(log, 'erro').mockImplementation(() => {});
    const sucessoSpy = vi.spyOn(log, 'sucesso').mockImplementation(() => {});

    await corrigirEstrutura([{ arquivo, ideal, atual }], [], tmpDir);

    expect(erroSpy).toHaveBeenCalledWith(expect.stringContaining('Destino já existe'));
    expect(sucessoSpy).not.toHaveBeenCalled();

    // origem não movida
    const aindaExisteOrigem = await fs
      .stat(origemAbs)
      .then(() => true)
      .catch(() => false);
    expect(aindaExisteOrigem).toBe(true);
  });
});
