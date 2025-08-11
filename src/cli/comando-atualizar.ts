import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'node:child_process';

import type { FileEntryWithAst } from '../tipos/tipos.js';

import { iniciarInquisicao } from '../nucleo/inquisidor.js';
import { scanSystemIntegrity } from '../guardian/sentinela.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoAtualizar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('atualizar')
    .description('Atualiza o Oráculo se a integridade estiver preservada')
    .option('--global', 'atualiza globalmente via npm i -g')
    .action(async function (this: Command, opts: { global?: boolean }) {
      aplicarFlagsGlobais(this.parent && typeof this.parent.opts === 'function' ? this.parent.opts() : {});
      log.info(chalk.bold('\n🔄 Iniciando processo de atualização...\n'));

      const baseDir = process.cwd();
      let fileEntries: FileEntryWithAst[] = [];

      try {
        const resultado = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        fileEntries = resultado.fileEntries;

        const guardianResultado = await scanSystemIntegrity(fileEntries);

        if (
          guardianResultado.status === ('ok' as typeof guardianResultado.status) ||
          guardianResultado.status === ('baseline-aceito' as typeof guardianResultado.status)
        ) {
          log.sucesso('🔒 Guardian: integridade validada. Prosseguindo atualização.');
        } else {
          log.aviso('🌀 Guardian gerou novo baseline ou detectou alterações. Prosseguindo com cautela.');
          log.info('Recomendado: `oraculo guardian --diff` e `oraculo guardian --accept-baseline` antes de atualizar.');
        }

        const cmd = opts.global
          ? 'npm install -g oraculo@latest'
          : 'npm install oraculo@latest';

        log.info(`📥 Executando: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });

        log.sucesso('✅ Atualização concluída com sucesso!');
      } catch (err: unknown) {
        log.erro('🚨 Atualização abortada ou falhou.');
        if (typeof err === 'object' && err && 'detalhes' in err && Array.isArray((err as { detalhes?: unknown }).detalhes)) {
          (err as { detalhes: string[] }).detalhes.forEach((d: string) => { log.aviso('❗ ' + d); });
        }
        if (config.DEV_MODE) console.error(err);
        process.exit(1);
      }
    });
}