#!/usr/bin/env node
// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import chalk from '@nucleo/constelacao/chalk-safe.js';

import { registrarComandos } from '@cli/comandos.js';
import { comandoPerf } from '@cli/comando-perf.js';
import {
  config,
  aplicarConfigParcial,
  inicializarConfigDinamica,
} from '@nucleo/constelacao/cosmos.js';

// caminho do módulo (usado para localizar arquivos de configuração)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 📦 Ler versão dinamicamente do package.json
function getVersion(): string {
  try {
    // Ao compilar, este arquivo vai para dist/bin; o package.json fica na raiz (subir dois níveis)
    const packagePath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0'; // fallback
  }
}

// 🛠️ Configuração principal do CLI
const program = new Command();

program
  .name(chalk.magenta('oraculo'))
  .version(getVersion())
  .description('A ferramenta Oráculo: análise, reestruturação e proteção de repositórios.')
  .option('-s, --silence', 'silencia todos os logs de informação e aviso (sobrepõe --verbose)')
  .option(
    '-v, --verbose',
    'exibe logs detalhados de cada arquivo e técnica analisada (ignorado se --silence)',
  )
  .option('-e, --export', 'gera arquivos de relatório detalhados (JSON e Markdown)')
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
  dev?: boolean; // legado removido da CLI; mantido aqui apenas para compat de parse em tests antigos
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
    const { sanitizarFlags } = await import('../zeladores/util/validacao.js');
    sanitizarFlags(flags as Record<string, unknown>);
  } catch (e) {
    console.error(chalk.red(`❌ Flags inválidas: ${(e as Error).message}`));
    if (!process.env.VITEST) process.exit(1);
  }
  config.REPORT_SILENCE_LOGS = Boolean(flags.silence);
  config.REPORT_EXPORT_ENABLED = Boolean(flags.export);
  const debugAtivo = Boolean(flags.debug) || process.env.ORACULO_DEBUG === 'true';
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

  // Unificação: filtros de include/exclude são definidos apenas nos comandos
  // (--include/--exclude). Flags globais antigas removidas.
}

// 🔗 Registro de todos os comandos
registrarComandos(program, (o) => {
  return aplicarFlagsGlobais(o);
});
program.addCommand(comandoPerf());

// 🚀 Execução do CLI
// Carrega config de arquivo/env explicitamente no processo do CLI, mesmo sob VITEST (e2e spawn)
void (async () => {
  // Aplica defaults de produção (se presentes) antes de inicializar a config dinâmica.
  try {
    if (process.env.NODE_ENV === 'production') {
      try {
        // Em dist/bin, o safe config está na raiz do pacote: subir dois níveis
        const safeCfgPath = join(__dirname, '..', '..', 'oraculo.config.safe.json');
        const raw = readFileSync(safeCfgPath, 'utf-8');
        const safeCfg = JSON.parse(raw);
        const prod = safeCfg?.productionDefaults;
        if (prod && typeof prod === 'object') {
          for (const [k, v] of Object.entries(prod)) {
            if (process.env[k] === undefined) process.env[k] = String(v);
          }
        }
      } catch {
        // ignore - arquivo safe pode não existir em todos os ambientes
      }
    }
    await inicializarConfigDinamica();
  } catch {
    // ignore: CLI continua com defaults
  }
  await program.parseAsync(process.argv);
})();
