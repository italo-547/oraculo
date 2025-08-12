import { describe, it, expect, vi } from 'vitest';
import { comandoAnalistas } from './comando-analistas.js';
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

import { log } from '../nucleo/constelacao/log.js';
import { salvarEstado } from '../zeladores/util/persistencia.js';

describe('comando-analistas', () => {
  it('imprime lista em modo texto', async () => {
    const program = new Command();
    program.addCommand(comandoAnalistas());
    await program.parseAsync(['node', 'cli', 'analistas']);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Analistas registrados'));
  });

  it('imprime JSON inline', async () => {
    const program = new Command();
    program.addCommand(comandoAnalistas());
    await program.parseAsync(['node', 'cli', 'analistas', '--json']);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('"analistas"'));
  });

  it('exporta para arquivo', async () => {
    const program = new Command();
    program.addCommand(comandoAnalistas());
    await program.parseAsync(['node', 'cli', 'analistas', '--output', 'analistas.json']);
    expect(salvarEstado).toHaveBeenCalled();
  });

  it('gera documentação markdown', async () => {
    const program = new Command();
    program.addCommand(comandoAnalistas());
    await program.parseAsync(['node', 'cli', 'analistas', '--doc', 'ANALISTAS.md']);
    expect(salvarEstado).toHaveBeenCalledWith(
      expect.stringContaining('ANALISTAS.md'),
      expect.stringContaining('# Analistas Registrados'),
    );
  });
});
