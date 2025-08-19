// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import { Command } from 'commander';

vi.mock('../analistas/registry.js', () => ({
  registroAnalistas: [
    { nome: 'a1', categoria: 'c1', descricao: 'd1', limites: { linhas: 30 } },
    { nome: 'a2', categoria: 'c2', descricao: '' },
  ],
  listarAnalistas: () => [
    { nome: 'a1', categoria: 'c1', descricao: 'd1' },
    { nome: 'a2', categoria: 'c2', descricao: '' },
  ],
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() },
}));
vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn().mockResolvedValue(undefined),
}));

import { salvarEstado } from '../zeladores/util/persistencia.js';
import { comandoAnalistas } from './comando-analistas.js';

describe('comando-analistas branches extra (paths absolutos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera documentação markdown com caminho absoluto (cobre branch path.isAbsolute)', async () => {
    const program = new Command();
    program.addCommand(comandoAnalistas());
    const destinoAbs = path.join(process.cwd(), 'ANALISTAS_ABS.md');
    await program.parseAsync(['node', 'cli', 'analistas', '--doc', destinoAbs]);
    expect(salvarEstado).toHaveBeenCalledWith(
      expect.stringContaining('ANALISTAS_ABS.md'),
      expect.stringContaining('# Analistas Registrados'),
    );
  });

  it('exporta JSON com caminho absoluto (cobre branch path.isAbsolute)', async () => {
    const program = new Command();
    program.addCommand(comandoAnalistas());
    const destinoAbs = path.join(process.cwd(), 'analistas_abs.json');
    await program.parseAsync(['node', 'cli', 'analistas', '--output', destinoAbs]);
    expect(salvarEstado).toHaveBeenCalledWith(
      expect.stringContaining('analistas_abs.json'),
      expect.objectContaining({ total: 2 }),
    );
  });
});
