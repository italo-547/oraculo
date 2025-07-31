import { Command } from 'commander';
import chalk from 'chalk';

import type { Ocorrencia, FileEntryWithAst } from '../tipos/tipos.js';

import { iniciarInquisicao, executarInquisicao, tecnicas } from '../nucleo/inquisidor.js';
import { corrigirEstrutura } from '../zeladores/corretor-estrutura.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoReestruturar(aplicarFlagsGlobais: (opts: any) => void) {
  return new Command('reestruturar')
    .description('Aplica correções estruturais e otimizações ao repositório.')
    .option('-a, --auto', 'Aplica correções automaticamente sem confirmação (CUIDADO!)', false)
    .action(async (opts) => {
      aplicarFlagsGlobais(this.parent?.opts?.() ?? {});
      log.info(chalk.bold('\n⚙️ Iniciando processo de reestruturação...\n'));

      const baseDir = process.cwd();

      try {
        const { fileEntries }: { fileEntries: FileEntryWithAst[] } = await iniciarInquisicao(baseDir, { incluirMetadados: true });
        const analiseParaCorrecao = await executarInquisicao(fileEntries, tecnicas, baseDir);

        if (analiseParaCorrecao.ocorrencias.length === 0) {
          log.sucesso('🎉 Nenhuma correção estrutural necessária. Repositório já otimizado!');
          return;
        }

        log.aviso(`\n${analiseParaCorrecao.ocorrencias.length} problemas estruturais detectados para correção:`);
        analiseParaCorrecao.ocorrencias.forEach((occ: Ocorrencia) =>
          log.info(`- [${occ.tipo}] ${occ.filePath ?? occ.arquivo ?? 'arquivo desconhecido'}: ${occ.mensagem}`)
        );

        if (!opts.auto) {
          const readline = await import('node:readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const answer = await rl.question(chalk.yellow('Tem certeza que deseja aplicar essas correções? (s/N) '));
          rl.close();

          if (answer.toLowerCase() !== 's') {
            log.info('❌ Reestruturação cancelada.');
            return;
          }
        }

        const resultadoCorrecao: ResultadoCorrecao = await corrigirEstrutura(analiseParaCorrecao.ocorrencias);
        log.sucesso(`✅ Reestruturação concluída: ${resultadoCorrecao.correcoesAplicadas} correções aplicadas.`);
      } catch (error: any) {
        log.erro(`❌ Erro durante a reestruturação: ${error.message}`);
        if (config.DEV_MODE) console.error(error);
        process.exit(1);
      }
    });
}