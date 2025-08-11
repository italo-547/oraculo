#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

import { registrarComandos } from './cli/comandos.js';
import { config } from './nucleo/constelacao/cosmos.js';

// 🛠️ Configuração principal do CLI
const program = new Command();

program
  .name(chalk.magenta('oraculo'))
  .version('1.0.0')
  .description('A ferramenta Oráculo: análise, reestruturação e proteção de repositórios.')
  .option('-s, --silence', 'silencia todos os logs de informação e aviso (sobrepõe --verbose)')
  .option('-v, --verbose', 'exibe logs detalhados de cada arquivo e técnica analisada (ignorado se --silence)')
  .option('-e, --export', 'gera arquivos de relatório detalhados (JSON e Markdown)')
  .option('-d, --dev', 'ativa modo de desenvolvimento (logs de debug)');

// 🌐 Flags globais aplicáveis em todos os comandos
interface OraculoGlobalFlags {
  silence?: boolean;
  verbose?: boolean;
  export?: boolean;
  dev?: boolean;
}
function aplicarFlagsGlobais(opts: unknown) {
  const flags = opts as OraculoGlobalFlags;
  config.REPORT_SILENCE_LOGS = Boolean(flags.silence);
  config.REPORT_EXPORT_ENABLED = Boolean(flags.export);
  config.DEV_MODE = Boolean(flags.dev);
  // Se silence está ativo, verbose é sempre falso
  config.VERBOSE = flags.silence ? false : Boolean(flags.verbose);
}

// 🔗 Registro de todos os comandos
registrarComandos(program, aplicarFlagsGlobais);

// 🚀 Execução do CLI
void program.parseAsync(process.argv);
