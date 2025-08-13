import { Command } from 'commander';
import chalk from 'chalk';

import type { FileEntryWithAst } from '../tipos/tipos.js';
import { IntegridadeStatus } from '../tipos/tipos.js';

import { iniciarInquisicao } from '../nucleo/inquisidor.js';
import { scanSystemIntegrity, acceptNewBaseline } from '../guardian/sentinela.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

export function comandoGuardian(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('guardian')
    .description('Gerencia e verifica a integridade do ambiente do Oráculo.')
    .option('-a, --accept-baseline', 'Aceita o baseline atual como o novo baseline de integridade')
    .option('-d, --diff', 'Mostra as diferenças entre o estado atual e o baseline')
    .option(
      '--full-scan',
      'Executa verificação sem aplicar GUARDIAN_IGNORE_PATTERNS (não persistir baseline)',
    )
    .option('--json', 'Saída em JSON estruturado (para CI/integracoes)')
    .action(async function (
      this: Command,
      opts: { acceptBaseline?: boolean; diff?: boolean; fullScan?: boolean; json?: boolean },
    ) {
      aplicarFlagsGlobais(
        this.parent && typeof this.parent.opts === 'function' ? this.parent.opts() : {},
      );

      const baseDir = process.cwd();
      let fileEntries: FileEntryWithAst[] = [];

      try {
        const resultadoInquisicao = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        fileEntries = resultadoInquisicao.fileEntries;
        const ignoradosOriginaisRaw = (config as { GUARDIAN_IGNORE_PATTERNS?: string[] })
          .GUARDIAN_IGNORE_PATTERNS;
        const ignoradosOriginais = Array.isArray(ignoradosOriginaisRaw)
          ? [...ignoradosOriginaisRaw]
          : [];
        if (opts.fullScan) {
          // Temporariamente desabilita padrões ignorados
          (config as unknown as { GUARDIAN_IGNORE_PATTERNS: string[] }).GUARDIAN_IGNORE_PATTERNS =
            [];
          if (!opts.acceptBaseline) {
            log.aviso('⚠️ --full-scan ativo: baseline NÃO será persistido com escopo expandido.');
          }
        }

        if (opts.acceptBaseline) {
          if (opts.fullScan) {
            log.aviso(
              '🚫 Não é permitido aceitar baseline em modo --full-scan. Remova a flag e repita.',
            );
            (config as unknown as { GUARDIAN_IGNORE_PATTERNS: string[] }).GUARDIAN_IGNORE_PATTERNS =
              ignoradosOriginais;
            process.exit(1);
          }
          log.info(chalk.bold('\n🔄 Aceitando novo baseline de integridade...\n'));
          await acceptNewBaseline(fileEntries);
          if (opts.json) {
            console.log(JSON.stringify({ status: IntegridadeStatus.Aceito, baseline: true }));
          } else {
            log.sucesso('🔒 Novo baseline de integridade aceito com sucesso!');
          }
        } else if (opts.diff) {
          log.info(chalk.bold('\n📊 Comparando integridade do Oráculo com o baseline...\n'));
          const diffResult = await scanSystemIntegrity(fileEntries, { justDiff: true });
          const statusDiff = String(
            (diffResult as { status?: string } | null)?.status || '',
          ).toLowerCase();
          const alteracoes =
            statusDiff === String(IntegridadeStatus.AlteracoesDetectadas).toLowerCase() ||
            statusDiff.includes('alterac') ||
            statusDiff.includes('diferen');
          if (alteracoes && diffResult.detalhes && diffResult.detalhes.length) {
            if (opts.json) {
              console.log(
                JSON.stringify({
                  status: 'alteracoes-detectadas',
                  detalhes: diffResult.detalhes,
                }),
              );
            } else {
              log.aviso('🚨 Diferenças detectadas:');
              diffResult.detalhes?.forEach((d: string) => {
                log.info(`  - ${d}`);
              });
              log.aviso(
                'Execute `oraculo guardian --accept-baseline` para aceitar essas mudanças.',
              );
            }
            process.exit(1);
          } else {
            if (opts.json) {
              console.log(JSON.stringify({ status: 'ok', detalhes: [] }));
            } else {
              log.sucesso('✅ Nenhuma diferença detectada. Integridade preservada.');
            }
          }
        } else {
          log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
          const guardianResultado = await scanSystemIntegrity(fileEntries);
          const statusRaw = String(
            (guardianResultado as { status?: string } | null)?.status || '',
          ).toLowerCase();
          const statusNorm = (() => {
            if (statusRaw === String(IntegridadeStatus.Ok).toLowerCase() || statusRaw === 'ok')
              return IntegridadeStatus.Ok;
            if (
              statusRaw === String(IntegridadeStatus.Criado).toLowerCase() ||
              statusRaw.includes('baseline-criado')
            )
              return IntegridadeStatus.Criado;
            if (
              statusRaw === String(IntegridadeStatus.Aceito).toLowerCase() ||
              statusRaw.includes('baseline-aceito')
            )
              return IntegridadeStatus.Aceito;
            if (
              statusRaw === String(IntegridadeStatus.AlteracoesDetectadas).toLowerCase() ||
              statusRaw.includes('alterac')
            )
              return IntegridadeStatus.AlteracoesDetectadas;
            return IntegridadeStatus.Ok;
          })();
          switch (statusNorm) {
            case IntegridadeStatus.Ok:
              if (opts.json) console.log(JSON.stringify({ status: 'ok' }));
              else log.sucesso('🔒 Guardian: integridade preservada.');
              break;
            case IntegridadeStatus.Criado:
              if (opts.json) console.log(JSON.stringify({ status: 'baseline-criado' }));
              else log.info('📘 Guardian: baseline inicial criado.');
              log.aviso(
                'Execute `oraculo guardian --accept-baseline` para aceitá-lo ou `oraculo diagnosticar` novamente.',
              );
              break;
            case IntegridadeStatus.Aceito:
              if (opts.json) console.log(JSON.stringify({ status: 'baseline-aceito' }));
              else log.sucesso('🌀 Guardian: baseline atualizado e aceito.');
              break;
            case IntegridadeStatus.AlteracoesDetectadas: {
              if (opts.json) {
                console.log(JSON.stringify({ status: 'alteracoes-detectadas' }));
              } else {
                log.aviso(
                  '🚨 Guardian: alterações suspeitas detectadas! Execute `oraculo guardian --diff` para ver detalhes.',
                );
              }
              process.exit(1);
              break;
            }
          }
        }
        if (opts.fullScan) {
          // Restaura padrões originais após execução
          (config as unknown as { GUARDIAN_IGNORE_PATTERNS: string[] }).GUARDIAN_IGNORE_PATTERNS =
            ignoradosOriginais;
        }
      } catch (err) {
        log.erro(`❌ Erro no Guardian: ${(err as Error).message ?? String(err)}`);
        if (config.DEV_MODE) console.error(err);
        if (opts.json)
          console.log(JSON.stringify({ status: 'erro', mensagem: (err as Error).message }));
        process.exit(1);
      }
    });
}
