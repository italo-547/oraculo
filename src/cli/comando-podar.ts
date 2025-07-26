import { Command } from 'commander';
import chalk from 'chalk';

import type { FileEntryWithAst, ArquivoFantasma } from '../tipos/tipos.js';

import { iniciarInquisicao } from '../nucleo/inquisidor.js';
import { removerArquivosOrfaos } from '../zeladores/poda.js';
import log from '../nucleo/constelacao/log.js';
import config from '../nucleo/constelacao/cosmos.js';

export function comandoPodar(aplicarFlagsGlobais: (opts: any) => void)  {
  return new Command('podar')
    .description('Remove arquivos órfãos e lixo do repositório.')
    .option('-f, --force', 'Remove arquivos sem confirmação (CUIDADO!)', false)
    .action(async (opts) => {
      aplicarFlagsGlobais(this.parent?.opts?.() ?? {});
      log.info(chalk.bold('\n🌳 Iniciando processo de poda...\n'));

      const baseDir = process.cwd();

      try {
        const { fileEntries } = await iniciarInquisicao(baseDir, { incluirMetadados: false });
const resultadoPoda: ResultadoPoda = await removerArquivosOrfaos(fileEntries);
        if (resultadoPoda.arquivosOrfaos.length === 0) {
          log.sucesso('🎉 Nenhuma sujeira detectada. Repositório limpo!');
          return;
        }

        log.aviso(`\n${resultadoPoda.arquivosOrfaos.length} arquivos órfãos detectados:`);
        resultadoPoda.arquivosOrfaos.forEach((file) => log.info(`- ${file.arquivo}`));

        if (!opts.force) {
          const readline = await import('node:readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const answer = await rl.question(chalk.yellow('Tem certeza que deseja remover esses arquivos? (s/N) '));
          rl.close();

          if (answer.toLowerCase() !== 's') {
            log.info('❌ Poda cancelada.');
            return;
          }
        }

        await removerArquivosOrfaos(fileEntries, true);
        log.sucesso('✅ Poda concluída: Arquivos órfãos removidos com sucesso!');
      } catch (error: any) {
        log.erro(`❌ Erro durante a poda: ${error.message}`);
        if (config.DEV_MODE) console.error(error);
        process.exit(1);
      }
    });
}