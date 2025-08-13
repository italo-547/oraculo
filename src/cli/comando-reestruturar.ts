import { Command } from 'commander';
import chalk from 'chalk';

import type { Ocorrencia, FileEntryWithAst } from '../tipos/tipos.js';

import {
  iniciarInquisicao,
  executarInquisicao,
  tecnicas,
  prepararComAst,
} from '../nucleo/inquisidor.js';
import { detectarArquetipos } from '../analistas/detector-arquetipos.js';
import { corrigirEstrutura } from '../zeladores/corretor-estrutura.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoReestruturar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('reestruturar')
    .description('Aplica correções estruturais e otimizações ao repositório.')
    .option('-a, --auto', 'Aplica correções automaticamente sem confirmação (CUIDADO!)', false)
    .option('--aplicar', 'Alias de --auto (deprecated futuramente)', false)
    .option('--somente-plano', 'Exibe apenas o plano sugerido e sai (dry-run)', false)
    .action(async function (
      this: Command,
      opts: { auto?: boolean; aplicar?: boolean; somentePlano?: boolean },
    ) {
      aplicarFlagsGlobais(
        this.parent?.opts && typeof this.parent.opts === 'function' ? this.parent.opts() : {},
      );
      log.info(chalk.bold('\n⚙️ Iniciando processo de reestruturação...\n'));

      const baseDir = process.cwd();

      try {
        const { fileEntries }: { fileEntries: FileEntryWithAst[] } = await iniciarInquisicao(
          baseDir,
          { incluirMetadados: true, skipExec: true },
        );
        const fileEntriesComAst =
          typeof prepararComAst === 'function'
            ? await prepararComAst(fileEntries, baseDir)
            : fileEntries;
        const analiseParaCorrecao = await executarInquisicao(
          fileEntriesComAst,
          tecnicas,
          baseDir,
          undefined,
          { verbose: false, compact: true },
        );

        // Obter planoSugestao via detector de arquétipos (tolerante a falha)
        interface PlanoSugestaoMove {
          de: string;
          para: string;
        }
        interface PlanoSugestao {
          mover: PlanoSugestaoMove[];
          conflitos?: unknown[];
        }
        let plano: PlanoSugestao | undefined = undefined;
        try {
          const arqs = await detectarArquetipos({ arquivos: fileEntriesComAst, baseDir }, baseDir);
          plano = arqs.melhores[0]?.planoSugestao;
        } catch (e) {
          log.aviso('⚠️ Falha ao gerar planoSugestao (prosseguindo com fallback de ocorrências).');
          if (config.DEV_MODE) console.error(e);
        }

        if (plano) {
          if (!plano.mover.length) {
            log.info('📦 Plano vazio: nenhuma movimentação sugerida.');
          } else {
            log.info(`📦 Plano sugerido: ${plano.mover.length} movimentação(ões)`);
            plano.mover.slice(0, 10).forEach((m) => log.info(`  - ${m.de} → ${m.para}`));
            if (plano.mover.length > 10) log.info(`  ... +${plano.mover.length - 10} restantes`);
            if (plano.conflitos?.length)
              log.aviso(`⚠️ Conflitos detectados: ${plano.conflitos.length}`);
          }
        } else {
          log.aviso('📦 Sem planoSugestao (nenhum candidato ou erro). Usando ocorrências.');
        }

        if (opts.somentePlano) {
          log.info('Dry-run solicitado (--somente-plano). Nenhuma ação aplicada.');
          return;
        }

        const fallbackOcorrencias = analiseParaCorrecao.ocorrencias as Ocorrencia[] | undefined;
        const usarFallback =
          (!plano || !plano.mover.length) && fallbackOcorrencias && fallbackOcorrencias.length > 0;

        let mapaMoves = [] as { arquivo: string; ideal: string | null; atual: string }[];
        if (plano && plano.mover.length) {
          mapaMoves = plano.mover.map((m) => ({
            arquivo: m.de,
            ideal: m.para ? m.para.substring(0, m.para.lastIndexOf('/')) : null,
            atual: m.de,
          }));
        } else if (usarFallback) {
          log.aviso(
            `\n${fallbackOcorrencias.length} problemas estruturais detectados para correção:`,
          );
          fallbackOcorrencias.forEach((occ: Ocorrencia) => {
            const rel = occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido';
            log.info(`- [${occ.tipo}] ${rel}: ${occ.mensagem}`);
            mapaMoves.push({ arquivo: rel, ideal: null, atual: rel });
          });
        }

        if (!mapaMoves.length) {
          log.sucesso('🎉 Nenhuma correção estrutural necessária. Repositório já otimizado!');
          return;
        }

        const aplicar = opts.auto || (opts as { aplicar?: boolean }).aplicar;
        if (!aplicar) {
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
            log.info('❌ Reestruturação cancelada. (Use --auto para aplicar sem prompt)');
            return;
          }
        }

        await corrigirEstrutura(mapaMoves, fileEntriesComAst, baseDir);
        const frase = usarFallback ? 'correções aplicadas' : 'movimentos solicitados';
        log.sucesso(`✅ Reestruturação concluída: ${mapaMoves.length} ${frase}.`);
      } catch (error) {
        log.erro(
          `❌ Erro durante a reestruturação: ${typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error)}`,
        );
        if (config.DEV_MODE) console.error(error);
        process.exit(1);
      }
    });
}
