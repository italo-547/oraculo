import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'node:fs/promises';

import type { Ocorrencia, FileEntryWithAst, IntegridadeStatus, ResultadoGuardian } from '../tipos/tipos.js';

import { iniciarInquisicao, executarInquisicao, tecnicas } from '../nucleo/inquisidor.js';
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
    .option('-g, --guardian-check', 'Ativa a verificação de integridade do Guardian durante o diagnóstico')
    .action(async (opts: { guardianCheck?: boolean }, command: Command) => {
      aplicarFlagsGlobais((command.parent?.opts && typeof command.parent.opts === 'function') ? command.parent.opts() : {});
      config.GUARDIAN_ENABLED = opts.guardianCheck ?? false;

      log.info(chalk.bold('\n🔍 Iniciando diagnóstico completo...\n'));

      const baseDir = process.cwd();
      let guardianResultado: ResultadoGuardian | undefined;

      let fileEntries: FileEntryWithAst[] = [];
      let totalOcorrencias = 0;

      try {
        const leituraInicial = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        fileEntries = leituraInicial.fileEntries;

        if (config.GUARDIAN_ENABLED) {
          log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
          try {
            guardianResultado = await scanSystemIntegrity(fileEntries);
            switch (String(guardianResultado.status)) {
              case 'ok':
                log.sucesso('🔒 Guardian: integridade preservada.');
                break;
              case 'baseline-criado':
                log.info('📘 Guardian: baseline inicial criado.');
                break;
              case 'baseline-aceito':
                log.aviso('🌀 Guardian: novo baseline aceito — execute novamente.');
                break;
              case 'alteracoes-detectadas':
                log.aviso('🚨 Guardian: alterações suspeitas detectadas! Considere executar `oraculo guardian --diff`.');
                totalOcorrencias++;
                break;
            }
          } catch (err) {
            log.erro('🚨 Guardian bloqueou: alterações suspeitas ou erro fatal.');
            if (config.GUARDIAN_ENFORCE_PROTECTION && typeof err === 'object' && err && 'detalhes' in err && Array.isArray((err as { detalhes?: unknown }).detalhes)) {
              (err as { detalhes: string[] }).detalhes.forEach((d) => { log.aviso('❗ ' + d); });
              process.exit(1);
            } else {
              log.aviso('⚠️ Modo permissivo: prosseguindo sob risco.');
            }
          }
        }

        const { fileEntries: fileEntriesComAst } = await iniciarInquisicao(baseDir, { incluirMetadados: true });
        const resultadoFinal = await executarInquisicao(fileEntriesComAst, tecnicas, baseDir, guardianResultado);

        totalOcorrencias += resultadoFinal.ocorrencias.length;

        log.info(chalk.bold('\n📊 Gerando relatórios analíticos...\n'));
        const alinhamentos = await alinhamentoEstrutural(fileEntriesComAst, baseDir);
        // Garante que ideal nunca é null
        const alinhamentosValidos = alinhamentos.map(a => ({ ...a, ideal: a.ideal || '' }));
        await gerarRelatorioEstrutura(alinhamentosValidos);
        await exibirRelatorioZeladorSaude(resultadoFinal.ocorrencias);
        exibirRelatorioPadroesUso();
        diagnosticarProjeto(sinaisDetectados);

        await emitirConselhoOracular({
          hora: new Date().getHours(),
          arquivosParaCorrigir: resultadoFinal.ocorrencias.length,
          arquivosParaPodar: 0, // Não implementado
          totalOcorrenciasAnaliticas: resultadoFinal.ocorrencias.length,
          integridadeGuardian: guardianResultado?.status ?? 'nao-verificado',
        });

        if (config.REPORT_EXPORT_ENABLED) {
          log.info(chalk.bold('\n💾 Exportando relatórios detalhados...\n'));
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const dir = typeof config.REPORT_OUTPUT_DIR === 'string' ? config.REPORT_OUTPUT_DIR : path.join(baseDir, 'oraculo-reports');
          const nome = `oraculo-relatorio-${ts}`;
          await fs.mkdir(dir, { recursive: true });

          const relatorioCompacto = {
            resumo: {
              totalArquivos: fileEntriesComAst.length,
              totalOcorrencias: resultadoFinal.ocorrencias.length,
              tiposOcorrencias: Object.fromEntries(
                Object.entries(
                  resultadoFinal.ocorrencias.reduce((acc: Record<string, number>, occ: Ocorrencia) => {
                    const tipo = occ.tipo || 'desconhecido';
                    acc[tipo] = (acc[tipo] || 0) + 1;
                    return acc;
                  }, {})
                ).sort(([, a], [, b]) => b - a)
              ),
              arquivosComProblemas: new Set(resultadoFinal.ocorrencias.map((o) => o.relPath)).size,
              integridadeGuardian: guardianResultado?.status ?? 'nao-verificado',
              baselineModificado: guardianResultado?.baselineModificado ?? false,
              arquivosOrfaosDetectados: 0, // Não implementado
            },
            detalhesOcorrencias: resultadoFinal.ocorrencias.map((occ: Ocorrencia) => ({
              filePath: occ.relPath,
              tipoOcorrencia: occ.tipo,
              mensagem: occ.mensagem,
              linha: occ.linha,
              coluna: occ.coluna,
            })),
          };

          await gerarRelatorioMarkdown({
            ...resultadoFinal,
            fileEntries: fileEntriesComAst,
            guardian: guardianResultado
          }, path.join(dir, `${nome}.md`));
          await fs.writeFile(path.join(dir, `${nome}.json`), JSON.stringify(relatorioCompacto, null, 2));
          log.sucesso(`Relatórios exportados para: ${dir}`);
        }

        if (totalOcorrencias === 0) {
          log.sucesso(chalk.bold('\n✨ Oráculo: Repositório impecável! Nenhum problema detectado.\n'));
        } else {
          log.aviso(chalk.bold(`\n⚠️ Oráculo: Diagnóstico concluído. ${totalOcorrencias} problema(s) detectado(s).`));
          log.info('Revise os relatórios acima ou exportados para mais detalhes.');
          process.exit(1);
        }
      } catch (error) {
        log.erro(`❌ Erro fatal durante o diagnóstico: ${(error as Error).message ?? String(error)}`);
        if (config.DEV_MODE) console.error(error);
        process.exit(1);
      }
    });
}