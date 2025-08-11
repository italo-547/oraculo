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
    .action(async function (this: Command, opts: { acceptBaseline?: boolean; diff?: boolean }) {
      aplicarFlagsGlobais(this.parent?.opts?.() ?? {});

      const baseDir = process.cwd();
      let fileEntries: FileEntryWithAst[] = [];

      try {
        const resultadoInquisicao = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        fileEntries = resultadoInquisicao.fileEntries;

        if (opts.acceptBaseline) {
          log.info(chalk.bold('\n🔄 Aceitando novo baseline de integridade...\n'));
          await acceptNewBaseline(fileEntries);
          log.sucesso('🔒 Novo baseline de integridade aceito com sucesso!');
        } else if (opts.diff) {
          log.info(chalk.bold('\n📊 Comparando integridade do Oráculo com o baseline...\n'));
          const diffResult = await scanSystemIntegrity(fileEntries, { justDiff: true });
          if (diffResult.status === IntegridadeStatus.AlteracoesDetectadas && diffResult.detalhes && diffResult.detalhes.length) {
            log.aviso('🚨 Diferenças detectadas:');
            diffResult.detalhes.forEach((d: string) => { log.info(`  - ${d}`); });
            log.aviso('Execute `oraculo guardian --accept-baseline` para aceitar essas mudanças.');
            process.exit(1);
          } else {
            log.sucesso('✅ Nenhuma diferença detectada. Integridade preservada.');
          }
        } else {
          log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
          const guardianResultado = await scanSystemIntegrity(fileEntries);
          switch (guardianResultado.status) {
            case IntegridadeStatus.Ok:
              log.sucesso('🔒 Guardian: integridade preservada.');
              break;
            case IntegridadeStatus.Criado:
              log.info('📘 Guardian: baseline inicial criado.');
              log.aviso('Execute `oraculo guardian --accept-baseline` para aceitá-lo ou `oraculo diagnosticar` novamente.');
              break;
            case IntegridadeStatus.Aceito:
              log.sucesso('🌀 Guardian: baseline atualizado e aceito.');
              break;
            case IntegridadeStatus.AlteracoesDetectadas:
              log.aviso('🚨 Guardian: alterações suspeitas detectadas! Execute `oraculo guardian --diff` para ver detalhes.');
              process.exit(1);
          }
        }
      } catch (err) {
        log.erro(`❌ Erro no Guardian: ${(err as Error).message ?? String(err)}`);
        if (config.DEV_MODE) console.error(err);
        process.exit(1);
      }
    });
}