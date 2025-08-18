// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { registrarComandos } from './comandos.js';

vi.mock('./comando-diagnosticar.js', () => ({
  comandoDiagnosticar: vi.fn(() => new Command('diagnosticar')),
}));
vi.mock('./comando-guardian.js', () => ({ comandoGuardian: vi.fn(() => new Command('guardian')) }));
vi.mock('./comando-podar.js', () => ({ comandoPodar: vi.fn(() => new Command('podar')) }));
vi.mock('./comando-reestruturar.js', () => ({
  comandoReestruturar: vi.fn(() => new Command('reestruturar')),
}));
vi.mock('./comando-atualizar.js', () => ({
  comandoAtualizar: vi.fn(() => new Command('atualizar')),
}));

describe('registrarComandos', () => {
  it('registra todos os comandos principais no Commander', () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    registrarComandos(program, aplicarFlagsGlobais);
    const comandos = program.commands.map((cmd) => cmd.name());
    expect(comandos).toEqual(
      expect.arrayContaining(['diagnosticar', 'guardian', 'podar', 'reestruturar', 'atualizar']),
    );
  });
});
