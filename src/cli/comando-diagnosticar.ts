import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import { salvarEstado } from '../zeladores/util/persistencia.js';

import type { Ocorrencia, FileEntryWithAst, ResultadoGuardian } from '../tipos/tipos.js';
import { IntegridadeStatus } from '../tipos/tipos.js';

import {
  iniciarInquisicao,
  executarInquisicao,
  tecnicas,
  prepararComAst,
} from '../nucleo/inquisidor.js';
import { scanSystemIntegrity } from '../guardian/sentinela.js';
import { alinhamentoEstrutural } from '../arquitetos/analista-estrutura.js';
import { diagnosticarProjeto } from '../arquitetos/diagnostico-projeto.js';
import { sinaisDetectados } from '../analistas/detector-estrutura.js';
import { gerarRelatorioEstrutura } from '../relatorios/relatorio-estrutura.js';
import { exibirRelatorioZeladorSaude } from '../relatorios/relatorio-zelador-saude.js';
import { exibirRelatorioPadroesUso } from '../relatorios/relatorio-padroes-uso.js';
import { emitirConselhoOracular } from '../relatorios/conselheiro-oracular.js';
import { gerarRelatorioMarkdown } from '../relatorios/gerador-relatorio.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';

export function comandoDiagnosticar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('diagnosticar')
    .alias('diag')
    .description('Executa uma análise completa do repositório')
    .option(
      '-g, --guardian-check',
      'Ativa a verificação de integridade do Guardian durante o diagnóstico',
    )
    .option('-v, --verbose', 'Exibe logs detalhados de cada arquivo e técnica analisada', false)
    .option(
      '-c, --compact',
      'Modo compacto: logs ainda mais resumidos para projetos grandes',
      false,
    )
    .option('--json', 'Saída JSON estruturada (para CI/integracoes)', false)
    .action(
      async (
        opts: { guardianCheck?: boolean; verbose?: boolean; compact?: boolean; json?: boolean },
        command: Command,
      ) => {
        aplicarFlagsGlobais(
          command.parent && typeof command.parent.opts === 'function' ? command.parent.opts() : {},
        );
        config.GUARDIAN_ENABLED = opts.guardianCheck ?? false;
        config.VERBOSE = opts.verbose ?? false;
        config.COMPACT_MODE = opts.compact ?? false;

        let iniciouDiagnostico = false;
        const baseDir = process.cwd();
        let guardianResultado: ResultadoGuardian | undefined;
        let fileEntries: FileEntryWithAst[] = [];
        let totalOcorrencias = 0;
        // Tipagem segura de globais auxiliares usados para agregar erros de parsing
        interface OraculoGlobals {
          __ORACULO_PARSE_ERROS_ORIGINAIS__?: number;
          __ORACULO_PARSE_ERROS__?: unknown[];
        }
        const oraculoGlobals = globalThis as unknown as OraculoGlobals & Record<string, unknown>;

        try {
          if (opts.json) {
            // Suprime cabeçalhos verbosos no modo JSON
          } else if (!iniciouDiagnostico && !config.COMPACT_MODE) {
            log.info(chalk.bold('\n🔍 Iniciando diagnóstico completo...\n'));
            iniciouDiagnostico = true;
          } else if (!iniciouDiagnostico && config.COMPACT_MODE) {
            log.info(chalk.bold('\n🔍 Diagnóstico (modo compacto)...\n'));
            iniciouDiagnostico = true;
          }
          // 1) Primeira varredura rápida (sem AST) apenas para obter entries e opcionalmente rodar Guardian
          // Usa skipExec para evitar execução duplicada das técnicas – apenas coleta entries iniciais
          const leituraInicial = await iniciarInquisicao(baseDir, {
            incluirMetadados: false,
            skipExec: true,
          });
          fileEntries = leituraInicial.fileEntries; // contém conteúdo mas sem AST

          if (config.GUARDIAN_ENABLED) {
            log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
            try {
              const resultado = await scanSystemIntegrity(fileEntries);
              guardianResultado = resultado;
              switch (resultado.status) {
                case IntegridadeStatus.Ok:
                  log.sucesso('🔒 Guardian: integridade preservada.');
                  break;
                case IntegridadeStatus.Criado:
                  log.info('📘 Guardian: baseline inicial criado.');
                  break;
                case IntegridadeStatus.Aceito:
                  log.aviso('🌀 Guardian: novo baseline aceito — execute novamente.');
                  break;
                case IntegridadeStatus.AlteracoesDetectadas:
                  log.aviso(
                    '🚨 Guardian: alterações suspeitas detectadas! Considere executar `oraculo guardian --diff`.',
                  );
                  totalOcorrencias++;
                  break;
              }
            } catch (err) {
              log.erro('🚨 Guardian bloqueou: alterações suspeitas ou erro fatal.');
              if (
                config.GUARDIAN_ENFORCE_PROTECTION &&
                typeof err === 'object' &&
                err &&
                'detalhes' in err &&
                Array.isArray((err as { detalhes?: unknown }).detalhes)
              ) {
                (err as { detalhes: string[] }).detalhes.forEach((d) => {
                  log.aviso('❗ ' + d);
                });
                if (!process.env.VITEST) process.exit(1);
              } else {
                log.aviso('⚠️ Modo permissivo: prosseguindo sob risco.');
              }
            }
          }

          // Se modo somente varredura estiver ativo, encerramos após coleta inicial (antes de preparar AST)
          if (config.SCAN_ONLY) {
            log.info(chalk.bold(`\n🗺️  Modo scan-only: ${fileEntries.length} arquivos mapeados.`));
            if (config.REPORT_EXPORT_ENABLED) {
              try {
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                const dir =
                  typeof config.REPORT_OUTPUT_DIR === 'string'
                    ? config.REPORT_OUTPUT_DIR
                    : path.join(baseDir, 'oraculo-reports');
                await import('node:fs').then((fs) => fs.promises.mkdir(dir, { recursive: true }));
                const nome = `oraculo-scan-${ts}`;
                const resumo = {
                  modo: 'scan-only',
                  totalArquivos: fileEntries.length,
                  timestamp: new Date().toISOString(),
                };
                await salvarEstado(path.join(dir, `${nome}.json`), resumo);
                log.sucesso(`Relatório de scan salvo em ${dir}`);
              } catch (e) {
                log.erro(`Falha ao exportar relatório de scan-only: ${(e as Error).message}`);
              }
            }
            if (opts.json) {
              console.log(JSON.stringify({ modo: 'scan-only', totalArquivos: fileEntries.length }));
            }
            if (!process.env.VITEST) process.exit(0);
            return; // evita continuar
          }

          // 2) Preparar AST somente uma vez e executar técnicas (evita segunda inquisição completa)
          const fileEntriesComAst = await prepararComAst(fileEntries, baseDir);
          const resultadoFinal = await executarInquisicao(
            fileEntriesComAst,
            tecnicas,
            baseDir,
            guardianResultado,
            { verbose: config.VERBOSE, compact: config.COMPACT_MODE },
          );
          // Anexa erros de parsing coletados durante prepararComAst (não incluídos em executarInquisicao)
          const parseErrosRaw =
            (oraculoGlobals.__ORACULO_PARSE_ERROS__ as unknown[] | undefined) || [];
          const parseErros: Ocorrencia[] = parseErrosRaw.filter(
            (e): e is Ocorrencia =>
              !!e && typeof e === 'object' && 'tipo' in e && 'mensagem' in e && 'relPath' in e,
          );
          if (parseErros.length) {
            resultadoFinal.ocorrencias.push(...parseErros);
            // Limpa para evitar vazamento entre execuções
            delete oraculoGlobals.__ORACULO_PARSE_ERROS__;
          }
          totalOcorrencias += resultadoFinal.ocorrencias.length;

          // Resumo agrupado de tipos de problemas
          const tiposOcorrencias: Record<string, number> = {};
          let temErro = false;
          for (const occ of resultadoFinal.ocorrencias) {
            const tipo = occ.tipo ?? 'desconhecido';
            tiposOcorrencias[tipo] = (tiposOcorrencias[tipo] ?? 0) + 1;
            if (occ.nivel === 'erro') temErro = true;
          }
          // Métricas específicas de parse agregados
          const totalParseErrosOriginais = oraculoGlobals.__ORACULO_PARSE_ERROS_ORIGINAIS__;
          const parseAggregatedMetric = {
            totalOriginais: totalParseErrosOriginais || tiposOcorrencias['PARSE_ERRO'] || 0,
            totalExibidos: tiposOcorrencias['PARSE_ERRO'] || 0,
            agregados: totalParseErrosOriginais
              ? Math.max(0, (totalParseErrosOriginais || 0) - (tiposOcorrencias['PARSE_ERRO'] || 0))
              : 0,
          };
          // Garantia: parse errors sempre elevam a severidade mesmo que nivel não tenha sido propagado
          if (!temErro && tiposOcorrencias['PARSE_ERRO'] > 0 && config.PARSE_ERRO_FALHA) {
            temErro = true;
          }

          if (!config.COMPACT_MODE && !opts.json) {
            const alinhamentos = await alinhamentoEstrutural(fileEntriesComAst, baseDir);
            const alinhamentosValidos = alinhamentos.map((a) => ({ ...a, ideal: a.ideal ?? '' }));
            gerarRelatorioEstrutura(alinhamentosValidos);
            exibirRelatorioZeladorSaude(resultadoFinal.ocorrencias);
            exibirRelatorioPadroesUso();
            diagnosticarProjeto(sinaisDetectados);

            emitirConselhoOracular({
              hora: new Date().getHours(),
              arquivosParaCorrigir: resultadoFinal.ocorrencias.length,
              arquivosParaPodar: 0,
              totalOcorrenciasAnaliticas: resultadoFinal.ocorrencias.length,
              integridadeGuardian: guardianResultado ? guardianResultado.status : 'nao-verificado',
            });
          }

          if (config.REPORT_EXPORT_ENABLED && !opts.json) {
            log.info(chalk.bold('\n💾 Exportando relatórios detalhados...\n'));
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const dir =
              typeof config.REPORT_OUTPUT_DIR === 'string'
                ? config.REPORT_OUTPUT_DIR
                : path.join(baseDir, 'oraculo-reports');
            const nome = `oraculo-relatorio-${ts}`;
            await import('node:fs').then((fs) => fs.promises.mkdir(dir, { recursive: true }));

            const baselineModificado =
              typeof guardianResultado === 'object' &&
              'baselineModificado' in (guardianResultado ?? {})
                ? Boolean(
                    (guardianResultado as { baselineModificado?: boolean }).baselineModificado,
                  )
                : false;

            const relatorioCompacto = {
              resumo: {
                totalArquivos: fileEntriesComAst.length,
                totalOcorrencias: resultadoFinal.ocorrencias.length,
                tiposOcorrencias: Object.fromEntries(
                  Object.entries(
                    resultadoFinal.ocorrencias.reduce(
                      (acc: Record<string, number>, occ: Ocorrencia) => {
                        const tipo = occ.tipo ?? 'desconhecido';
                        acc[tipo] = (acc[tipo] ?? 0) + 1;
                        return acc;
                      },
                      {},
                    ),
                  ).sort(([, a], [, b]) => b - a),
                ),
                arquivosComProblemas: new Set(resultadoFinal.ocorrencias.map((o) => o.relPath))
                  .size,
                integridadeGuardian: guardianResultado
                  ? guardianResultado.status
                  : 'nao-verificado',
                baselineModificado,
                arquivosOrfaosDetectados: 0,
              },
              detalhesOcorrencias: resultadoFinal.ocorrencias.map((occ: Ocorrencia) => ({
                filePath: occ.relPath,
                tipoOcorrencia: occ.tipo,
                mensagem: occ.mensagem,
                linha: occ.linha,
                coluna: occ.coluna,
              })),
            };

            await gerarRelatorioMarkdown(
              {
                ...resultadoFinal,
                fileEntries: fileEntriesComAst,
                guardian: guardianResultado,
              },
              path.join(dir, `${nome}.md`),
            );
            await salvarEstado(path.join(dir, `${nome}.json`), relatorioCompacto);
            log.sucesso(`Relatórios exportados para: ${dir}`);
          }

          if (opts.json) {
            const saida = {
              status: temErro ? 'erro' : 'ok',
              guardian: guardianResultado ? guardianResultado.status : 'nao-verificado',
              totalArquivos: fileEntriesComAst.length,
              totalOcorrencias: resultadoFinal.ocorrencias.length,
              tiposOcorrencias,
              parseErros: parseAggregatedMetric,
              ocorrencias: resultadoFinal.ocorrencias.map((o) => ({
                tipo: o.tipo,
                relPath: o.relPath,
                mensagem: o.mensagem,
                nivel: o.nivel,
              })),
            };
            console.log(JSON.stringify(saida));
            if (temErro) {
              if (!process.env.VITEST) process.exit(1);
            } else if (!process.env.VITEST) process.exit(0);
          } else {
            if (totalOcorrencias === 0) {
              log.sucesso(
                chalk.bold('\n✨ Oráculo: Repositório impecável! Nenhum problema detectado.\n'),
              );
            } else {
              log.aviso(
                chalk.bold(
                  `\n⚠️ Oráculo: Diagnóstico concluído. ${totalOcorrencias} problema(s) detectado(s).`,
                ),
              );
              log.info('Resumo dos tipos de problemas encontrados:');
              for (const [tipo, qtd] of Object.entries(tiposOcorrencias)) {
                log.info(`  - ${tipo}: ${qtd}`);
              }
              if (temErro) {
                if (!process.env.VITEST) process.exit(1);
              } else if (!process.env.VITEST) {
                process.exit(0);
              }
            }
          }
        } catch (error) {
          log.erro(
            `❌ Erro fatal durante o diagnóstico: ${(error as Error).message ?? String(error)}`,
          );
          if (config.DEV_MODE) console.error(error);
          if (!process.env.VITEST) process.exit(1);
        }
      },
    );
}
