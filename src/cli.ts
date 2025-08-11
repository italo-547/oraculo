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
  .option('-s, --silence', 'silencia logs de informação e aviso')
  .option('-e, --export', 'gera arquivos de relatório detalhados (JSON e Markdown)')
  .option('-d, --dev', 'ativa modo de desenvolvimento (logs de debug)');

// 🌐 Flags globais aplicáveis em todos os comandos
interface OraculoGlobalFlags { silence?: boolean; export?: boolean; dev?: boolean; }
function aplicarFlagsGlobais(opts: OraculoGlobalFlags) {
  config.REPORT_SILENCE_LOGS = Boolean(opts.silence);
  config.REPORT_EXPORT_ENABLED = Boolean(opts.export);
  config.DEV_MODE = Boolean(opts.dev);
}

// 🔗 Registro de todos os comandos
registrarComandos(program, aplicarFlagsGlobais);

// 🚀 Execução do CLI
void program.parseAsync(process.argv);
