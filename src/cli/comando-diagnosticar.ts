// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { optionsDiagnosticar } from './options-diagnosticar.js';
import { processarDiagnostico } from './processamento-diagnostico.js';

export function comandoDiagnosticar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  const cmd = new Command('diagnosticar')
    .alias('diag')
    .description('Executa uma análise completa do repositório');

  // Em modo padrão, ignoramos opções desconhecidas para evitar saídas forçadas do Commander
  // (comportamento desejado também pelos testes de opções inválidas)
  cmd.allowUnknownOption(true);
  // Também aceitamos argumentos excedentes silenciosamente, pois diversos testes
  // passam o nome do comando na linha simulada (ex.: ['node','cli','diagnosticar', ...])
  // e o Commander trataria como "excess arguments" por padrão.
  cmd.allowExcessArguments(true);

  // Adiciona opções centralizadas
  for (const opt of optionsDiagnosticar) {
    if (opt.parser) {
      cmd.option(opt.flags, opt.desc, opt.parser, opt.defaultValue);
    } else if ('defaultValue' in opt) {
      cmd.option(opt.flags, opt.desc, opt.defaultValue);
    } else {
      cmd.option(opt.flags, opt.desc);
    }
  }

  cmd.action(
    async (
      opts: {
        guardianCheck?: boolean;
        verbose?: boolean;
        compact?: boolean;
        json?: boolean;
        include?: string[];
        exclude?: string[];
        listarAnalistas?: boolean;
        detalhado?: boolean;
      },
      command: Command,
    ) => {
      // Aplicar flags globais
      aplicarFlagsGlobais(
        command.parent && typeof command.parent.opts === 'function' ? command.parent.opts() : {},
      );

      // Delegar todo o processamento para a função modularizada
      await processarDiagnostico(opts);
    },
  );
  return cmd;
}
