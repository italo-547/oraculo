// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { prepararComAst } from '../../src/nucleo/inquisidor.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';
import path from 'node:path';

// Mock parser para detectar quantas vezes é chamado
vi.mock('../../src/nucleo/parser.js', () => ({
  decifrarSintaxe: vi.fn(async (code: string) => ({
    node: { type: 'File', body: [] },
    parent: null,
  })),
}));

import { decifrarSintaxe } from '../../src/nucleo/parser.js';

function criarEntry(relPath: string, content: string): any {
  return { relPath, content, fullPath: path.join(process.cwd(), relPath) };
}

describe('cache AST', () => {
  it('reutiliza AST quando arquivo inalterado', async () => {
    config.ANALISE_AST_CACHE_ENABLED = true;
    const entry = criarEntry('tmp-cache-file.ts', 'export const x=1');
    // Cria arquivo físico para ter stats estáveis
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(entry.fullPath, entry.content, 'utf-8'),
    );

    await prepararComAst([entry], process.cwd());
    await prepararComAst([entry], process.cwd());

    expect(decifrarSintaxe).toHaveBeenCalledTimes(1); // segunda chamada deve pegar cache
  });
});
