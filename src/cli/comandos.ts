import type { Command } from 'commander';
import { comandoDiagnosticar } from './comando-diagnosticar.js';
import { comandoGuardian } from './comando-guardian.js';
import { comandoPodar } from './comando-podar.js';
import { comandoReestruturar } from './comando-reestruturar.js';
import { comandoAtualizar } from './comando-atualizar.js';

export function registrarComandos(program: Command, aplicarFlagsGlobais: (opts: unknown) => void) {
  program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));
  program.addCommand(comandoGuardian(aplicarFlagsGlobais));
  program.addCommand(comandoPodar(aplicarFlagsGlobais));
  program.addCommand(comandoReestruturar(aplicarFlagsGlobais));
  program.addCommand(comandoAtualizar(aplicarFlagsGlobais));
}
