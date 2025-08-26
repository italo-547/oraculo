// SPDX-License-Identifier: MIT
import { config } from '../constelacao/cosmos.js';
import { execSync, type ExecSyncOptions } from 'node:child_process';

export function executarShellSeguro(cmd: string, opts: ExecSyncOptions = {}) {
  // only block if SAFE_MODE is explicitly true and ALLOW_EXEC is falsy
  if (config.SAFE_MODE === true && !config.ALLOW_EXEC) {
    throw new Error(
      'Execução de comandos desabilitada em SAFE_MODE. Defina ORACULO_ALLOW_EXEC=1 para permitir.',
    );
  }
  return execSync(cmd, opts);
}

export async function executarShellSeguroAsync(cmd: string, opts: ExecSyncOptions = {}) {
  // wrapper assíncrono que delega ao sync (usado onde já há await)
  return executarShellSeguro(cmd, opts);
}
