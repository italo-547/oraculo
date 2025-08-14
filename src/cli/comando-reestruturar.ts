import { Command } from 'commander';
import chalk from 'chalk';

import type { Ocorrencia, FileEntryWithAst } from '../tipos/tipos.js';

import {
  iniciarInquisicao,
  executarInquisicao,
  tecnicas,
  prepararComAst,
} from '../nucleo/inquisidor.js';
import { OperarioEstrutura } from '../zeladores/operario-estrutura.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoReestruturar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('reestruturar')
    .description('Aplica correções estruturais e otimizações ao repositório.')
    .option('-a, --auto', 'Aplica correções automaticamente sem confirmação (CUIDADO!)', false)
    .option('--aplicar', 'Alias de --auto (deprecated futuramente)', false)
    .option('--somente-plano', 'Exibe apenas o plano sugerido e sai (dry-run)', false)
    .option(
      '--domains',
      'Organiza por domains/<entidade>/<categoria>s (prioriza sobre --flat)',
      false,
    )
    .option('--flat', 'Organiza por src/<categoria>s (sem domains)', false)
    .option(
      '--prefer-estrategista',
      'Força uso do estrategista (ignora plano de arquétipos)',
      false,
    )
    .option('--preset <nome>', 'Preset de estrutura (oraculo|node-community|ts-lib)', 'oraculo')
    .option(
      '--categoria <pair>',
      'Override de categoria no formato chave=valor (ex.: controller=handlers). Pode repetir a flag.',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .action(async function (
      this: Command,
      opts: {
        auto?: boolean;
        aplicar?: boolean;
        somentePlano?: boolean;
        domains?: boolean;
        flat?: boolean;
        categoria?: string[];
        preferEstrategista?: boolean;
        preset?: string;
      },
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

        // Centraliza planejamento via Operário
        const map: Record<string, string> = {};
        const arr = Array.isArray(opts.categoria) ? opts.categoria : [];
        for (const p of arr) {
          const [k, v] = String(p).split('=');
          if (!k || !v) continue;
          map[k.trim().toLowerCase()] = v.trim();
        }
        if (opts.domains && opts.flat) {
          log.aviso('⚠️ --domains e --flat informados. Priorizando --domains.');
        }
        const criarSubpastasPorEntidade = opts.domains ? true : opts.flat ? false : undefined;
        const { plano, origem } = await OperarioEstrutura.planejar(baseDir, fileEntriesComAst, {
          preferEstrategista: opts.preferEstrategista,
          criarSubpastasPorEntidade,
          categoriasMapa: Object.keys(map).length ? map : undefined,
          preset: opts.preset,
        });

        if (plano) {
          if (!plano.mover.length) {
            log.info('📦 Plano vazio: nenhuma movimentação sugerida.');
          } else {
            log.info(`📦 Plano sugerido (${origem}): ${plano.mover.length} movimentação(ões)`);
            // Moldura com primeiras N entradas
            const linhas = [
              'De                                → Para',
              '----------------------------------  ---------------------------------------',
            ];
            const primeiraDez = plano.mover.slice(0, 10);
            for (const m of primeiraDez) {
              const de = String(m.de).replace(/\\/g, '/').slice(0, 34).padEnd(34, ' ');
              const para = String(m.para).replace(/\\/g, '/').slice(0, 39);
              linhas.push(`${de}  → ${para}`);
            }
            if (plano.mover.length > 10) {
              linhas.push(`... +${plano.mover.length - 10} restantes`);
            }
            try {
              const bloco = (log as unknown as { bloco: (t: string, l: string[]) => string }).bloco(
                'Plano de reestruturação',
                linhas,
              );
              // Imprimir moldura diretamente
              console.log(bloco);
            } catch {
              // fallback sem moldura caso log.bloco não exista no ambiente de teste
              primeiraDez.forEach((m) => log.info(`  - ${m.de} → ${m.para}`));
              if (plano.mover.length > 10) log.info(`  ... +${plano.mover.length - 10} restantes`);
            }
          }
          // Sempre exibir conflitos quando houver, mesmo com plano vazio
          if (plano.conflitos?.length) {
            log.aviso(`⚠️ Conflitos detectados: ${plano.conflitos.length}`);
            const conflitos = Array.isArray(plano.conflitos) ? plano.conflitos : [];
            const linhasConf: string[] = [
              'Destino                           Motivo',
              '-------------------------------   ------------------------------',
            ];
            const primeiros = conflitos.slice(0, 10);
            for (const c of primeiros) {
              const alvo = String((c && c.alvo) ?? JSON.stringify(c))
                .replace(/\\/g, '/')
                .slice(0, 31)
                .padEnd(31, ' ');
              const motivo = String((c && c.motivo) ?? '-').slice(0, 30);
              linhasConf.push(`${alvo}   ${motivo}`);
            }
            if (conflitos.length > 10) linhasConf.push(`... +${conflitos.length - 10} restantes`);
            try {
              const blocoConf = (
                log as unknown as { bloco: (t: string, l: string[]) => string }
              ).bloco('Conflitos de destino', linhasConf);
              console.log(blocoConf);
            } catch {
              // fallback sem moldura
              primeiros.forEach((c) =>
                log.aviso(
                  `  - ${(c && c.alvo) ?? 'alvo desconhecido'} :: ${(c && c.motivo) ?? '-'}`,
                ),
              );
              if (conflitos.length > 10) log.aviso(`  ... +${conflitos.length - 10} restantes`);
            }
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
          (!plano || !plano.mover.length) &&
          !!(fallbackOcorrencias && fallbackOcorrencias.length > 0);

        let mapaMoves = [] as { arquivo: string; ideal: string | null; atual: string }[];
        if (plano && plano.mover.length) {
          mapaMoves = OperarioEstrutura.toMapaMoves(plano);
        } else if (usarFallback) {
          log.aviso(
            `\n${fallbackOcorrencias.length} problemas estruturais detectados para correção:`,
          );
          fallbackOcorrencias.forEach((occ: Ocorrencia) => {
            const rel = occ.relPath ?? occ.arquivo ?? 'arquivo desconhecido';
            log.info(`- [${occ.tipo}] ${rel}: ${occ.mensagem}`);
          });
          mapaMoves = OperarioEstrutura.ocorrenciasParaMapa(fallbackOcorrencias);
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

        await OperarioEstrutura.aplicar(mapaMoves, fileEntriesComAst, baseDir);
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
