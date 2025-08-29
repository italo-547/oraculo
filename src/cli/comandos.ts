// SPDX-License-Identifier: MIT
import type { Command } from 'commander';
import { comandoDiagnosticar } from './comando-diagnosticar.js';
import { comandoGuardian } from './comando-guardian.js';
import { comandoPodar } from './comando-podar.js';
import { comandoReestruturar } from './comando-reestruturar.js';
import { comandoAtualizar } from './comando-atualizar.js';
import { comandoAnalistas } from './comando-analistas.js';
import { comandoMetricas } from './comando-metricas.js';
import { registrarComandoReverter } from './comando-reverter.js';

export function registrarComandos(program: Command, aplicarFlagsGlobais: (opts: unknown) => void) {
  program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));
  program.addCommand(comandoGuardian(aplicarFlagsGlobais));
  program.addCommand(comandoPodar(aplicarFlagsGlobais));
  program.addCommand(comandoReestruturar(aplicarFlagsGlobais));
  program.addCommand(comandoAtualizar(aplicarFlagsGlobais));
  program.addCommand(comandoAnalistas());
  program.addCommand(comandoMetricas());

  // Registra comando de reversão
  registrarComandoReverter(program);
}

/* istanbul ignore next */
/* istanbul ignore next */
if (false) 0; // removed stub import
