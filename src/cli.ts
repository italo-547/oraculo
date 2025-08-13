#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

import { registrarComandos } from './cli/comandos.js';
import { comandoPerf } from './cli/comando-perf.js';
import { config, aplicarConfigParcial } from './nucleo/constelacao/cosmos.js';

// 🛠️ Configuração principal do CLI
const program = new Command();

program
  .name(chalk.magenta('oraculo'))
  .version('1.0.0')
  .description('A ferramenta Oráculo: análise, reestruturação e proteção de repositórios.')
  .option('-s, --silence', 'silencia todos os logs de informação e aviso (sobrepõe --verbose)')
  .option(
    '-v, --verbose',
    'exibe logs detalhados de cada arquivo e técnica analisada (ignorado se --silence)',
  )
  .option('-e, --export', 'gera arquivos de relatório detalhados (JSON e Markdown)')
  .option('-d, --dev', 'ativa modo de desenvolvimento (deprecated, use --debug)')
  .option('--debug', 'ativa logs de debug (equivalente a --dev)');
// Flag experimental implementada
program.option('--scan-only', 'executa apenas varredura e priorização sem AST ou técnicas');
// Flags experimentais de config dinâmica (exemplos comuns)
program
  .option('--log-estruturado', 'ativa logging estruturado JSON')
  .option('--incremental', 'habilita análise incremental')
  .option('--no-incremental', 'desabilita análise incremental')
  .option('--metricas', 'habilita métricas de análise')
  .option('--no-metricas', 'desabilita métricas de análise');

// 🌐 Flags globais aplicáveis em todos os comandos
interface OraculoGlobalFlags {
  silence?: boolean;
  verbose?: boolean;
  export?: boolean;
  dev?: boolean;
  debug?: boolean;
  logEstruturado?: boolean;
  incremental?: boolean;
  meticas?: boolean;
  scanOnly?: boolean;
}
async function aplicarFlagsGlobais(opts: unknown) {
  const flags = opts as OraculoGlobalFlags;
  // Sanitização e normalização (pode lançar)
  try {
    // lazy import para não criar ciclo
    const { sanitizarFlags } = await import('./zeladores/util/validacao.js');
    sanitizarFlags(flags as Record<string, unknown>);
  } catch (e) {
    console.error(chalk.red(`❌ Flags inválidas: ${(e as Error).message}`));
    if (!process.env.VITEST) process.exit(1);
  }
  config.REPORT_SILENCE_LOGS = Boolean(flags.silence);
  config.REPORT_EXPORT_ENABLED = Boolean(flags.export);
  const debugAtivo =
    Boolean(flags.debug) || Boolean(flags.dev) || process.env.ORACULO_DEBUG === 'true';
  if (!flags.debug && flags.dev) {
    console.warn(chalk.yellow('⚠️  --dev está deprecado; prefira --debug.')); // aviso único
  }
  config.DEV_MODE = debugAtivo;
  config.SCAN_ONLY = Boolean(flags.scanOnly);
  // Se silence está ativo, verbose é sempre falso
  config.VERBOSE = flags.silence ? false : Boolean(flags.verbose);
  const overrides: Record<string, unknown> = {};
  const optObj = opts as Record<string, unknown>;
  if (typeof optObj.logEstruturado === 'boolean') overrides.LOG_ESTRUTURADO = optObj.logEstruturado;
  if (typeof optObj.incremental === 'boolean')
    overrides.ANALISE_INCREMENTAL_ENABLED = optObj.incremental;
  if (typeof optObj.metricas === 'boolean') overrides.ANALISE_METRICAS_ENABLED = optObj.metricas;
  if (Object.keys(overrides).length) aplicarConfigParcial(overrides);
}

// 🔗 Registro de todos os comandos
registrarComandos(program, (o) => {
  return aplicarFlagsGlobais(o);
});
program.addCommand(comandoPerf());

// 🚀 Execução do CLI
void program.parseAsync(process.argv);
