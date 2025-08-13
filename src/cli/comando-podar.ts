import { Command } from 'commander';
import chalk from 'chalk';

import type { ArquivoFantasma, ResultadoPoda } from '../tipos/tipos.js';

import { iniciarInquisicao } from '../nucleo/inquisidor.js';
import { removerArquivosOrfaos } from '../zeladores/poda.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoPodar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('podar')
    .description('Remove arquivos órfãos e lixo do repositório.')
    .option('-f, --force', 'Remove arquivos sem confirmação (CUIDADO!)', false)
    .action(async function (this: Command, opts: { force?: boolean }) {
      aplicarFlagsGlobais(
        this.parent && typeof this.parent.opts === 'function' ? this.parent.opts() : {},
      );
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
        resultadoPoda.arquivosOrfaos.forEach((file: ArquivoFantasma) => {
          log.info(`- ${file.arquivo}`);
        });

        if (!opts.force) {
          const readline = await import('node:readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await rl.question(
            chalk.yellow('Tem certeza que deseja remover esses arquivos? (s/N) '),
          );
          rl.close();

          // debug removido (usava console.log) – manter somente se modo debug ativo futuramente
          if (answer.toLowerCase() !== 's') {
            log.info('❌ Poda cancelada.');
            return;
          }
        }

        // Só remove se confirmado
        // --force: remove direto
        if (opts.force) {
          await removerArquivosOrfaos(fileEntries);
          log.sucesso('✅ Poda concluída: Arquivos órfãos removidos com sucesso!');
        }
      } catch (error) {
        log.erro(
          `❌ Erro durante a poda: ${typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error)}`,
        );
        if (config.DEV_MODE) console.error(error);
        process.exit(1);
      }
    });
}
