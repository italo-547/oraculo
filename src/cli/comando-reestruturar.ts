import { Command } from 'commander';
import chalk from 'chalk';

import type { Ocorrencia, FileEntryWithAst } from '../tipos/tipos.js';

import { iniciarInquisicao, executarInquisicao, tecnicas } from '../nucleo/inquisidor.js';
import { corrigirEstrutura } from '../zeladores/corretor-estrutura.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoReestruturar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('reestruturar')
    .description('Aplica correções estruturais e otimizações ao repositório.')
    .option('-a, --auto', 'Aplica correções automaticamente sem confirmação (CUIDADO!)', false)
    .action(async function (this: Command, opts: { auto?: boolean }) {
      aplicarFlagsGlobais(
        this.parent?.opts && typeof this.parent.opts === 'function' ? this.parent.opts() : {},
      );
      log.info(chalk.bold('\n⚙️ Iniciando processo de reestruturação...\n'));

      const baseDir = process.cwd();

      try {
        const { fileEntries }: { fileEntries: FileEntryWithAst[] } = await iniciarInquisicao(
          baseDir,
          { incluirMetadados: true },
        );
        const analiseParaCorrecao = await executarInquisicao(
          fileEntries,
          tecnicas,
          baseDir,
          undefined,
        );

        if (analiseParaCorrecao.ocorrencias.length === 0) {
          log.sucesso('🎉 Nenhuma correção estrutural necessária. Repositório já otimizado!');
          return;
        }

        log.aviso(
          `\n${analiseParaCorrecao.ocorrencias.length} problemas estruturais detectados para correção:`,
        );
        analiseParaCorrecao.ocorrencias.forEach((occ: Ocorrencia) => {
          log.info(
            `- [${occ.tipo}] ${occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido'}: ${occ.mensagem}`,
          );
        });

        if (!opts.auto) {
          const readline = await import('node:readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await rl.question(
            chalk.yellow('Tem certeza que deseja aplicar essas correções? (s/N) '),
          );
          rl.close();

          // Normaliza resposta: remove espaços e converte para minúsculo
          if (answer.trim().toLowerCase() !== 's') {
            log.info('❌ Reestruturação cancelada.');
            return;
          }
        }

        const mapa = analiseParaCorrecao.ocorrencias.map((occ: Ocorrencia) => ({
          arquivo: occ.relPath ?? occ.arquivo ?? 'arquivo_desconhecido',
          ideal: null,
          atual: occ.relPath ?? occ.arquivo ?? 'arquivo_desconhecido',
        }));
        await corrigirEstrutura(mapa, fileEntries, baseDir);
        log.sucesso(
          `✅ Reestruturação concluída: ${analiseParaCorrecao.ocorrencias.length} correções aplicadas.`,
        );
      } catch (error) {
        log.erro(
          `❌ Erro durante a reestruturação: ${typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error)}`,
        );
        if (config.DEV_MODE) console.error(error);
        process.exit(1);
      }
    });
}
