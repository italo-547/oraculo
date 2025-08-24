// SPDX-License-Identifier: MIT
import chalk from '../nucleo/constelacao/chalk-safe.js';
import { Command } from 'commander';

import type { ArquivoFantasma, ResultadoPoda } from '../tipos/tipos.js';

import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import { iniciarInquisicao } from '../nucleo/inquisidor.js';
import { removerArquivosOrfaos } from '../zeladores/poda.js';
import path from 'node:path';
import {
  gerarRelatorioPodaJson,
  gerarRelatorioPodaMarkdown,
} from '../relatorios/relatorio-poda.js';

export function comandoPodar(aplicarFlagsGlobais: (opts: Record<string, unknown>) => void) {
  return new Command('podar')
    .description('Remove arquivos órfãos e lixo do repositório.')
    .option('-f, --force', 'Remove arquivos sem confirmação (CUIDADO!)', false)
    .option(
      '--include <padrao>',
      'Glob pattern a INCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .option(
      '--exclude <padrao>',
      'Glob pattern a EXCLUIR adicionalmente (pode repetir a flag ou usar vírgulas / espaços)',
      (val: string, prev: string[]) => {
        prev.push(val);
        return prev;
      },
      [] as string[],
    )
    .action(async function (
      this: Command,
      opts: { force?: boolean; include?: string[]; exclude?: string[] },
    ) {
      aplicarFlagsGlobais(
        this.parent && typeof this.parent.opts === 'function' ? this.parent.opts() : {},
      );
      log.info(chalk.bold('\n🌳 Iniciando processo de poda...\n'));

      const baseDir = process.cwd();

      try {
        // Normaliza padrões de include/exclude para sincronizar filtros com o scanner
        const processPatternList = (raw: string[] | undefined) => {
          if (!raw || !raw.length) return [] as string[];
          return Array.from(
            new Set(
              raw
                .flatMap((r) => r.split(/[\s,]+/))
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          );
        };
        const expandIncludes = (list: string[]) => {
          const META = /[\\*\?\{\}\[\]]/;
          const out = new Set<string>();
          for (const p of list) {
            out.add(p);
            if (!META.test(p)) {
              out.add(p.replace(/\\+$/, '').replace(/\/+$/, '') + '/**');
              if (!p.includes('/') && !p.includes('\\')) out.add('**/' + p + '/**');
            }
          }
          return Array.from(out);
        };
        const includeListRaw = processPatternList(opts.include);
        const includeList = includeListRaw.length ? expandIncludes(includeListRaw) : [];
        const excludeList = processPatternList(opts.exclude);
        if (includeList.length) config.CLI_INCLUDE_PATTERNS = includeList;
        if (excludeList.length) config.CLI_EXCLUDE_PATTERNS = excludeList;
        const incluiNodeModules = includeList.some((p) => /node_modules/.test(p));
        if (incluiNodeModules) {
          config.ZELADOR_IGNORE_PATTERNS = config.ZELADOR_IGNORE_PATTERNS.filter(
            (p) => !/node_modules/.test(p),
          );
          config.GUARDIAN_IGNORE_PATTERNS = config.GUARDIAN_IGNORE_PATTERNS.filter(
            (p) => !/node_modules/.test(p),
          );
        }

        const { fileEntries } = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        const resultadoPoda: ResultadoPoda = await removerArquivosOrfaos(fileEntries);
        if (resultadoPoda.arquivosOrfaos.length === 0) {
          log.sucesso('🎉 Nenhuma sujeira detectada. Repositório limpo!');
          if (config.REPORT_EXPORT_ENABLED) {
            try {
              const ts = new Date().toISOString().replace(/[:.]/g, '-');
              const dir =
                typeof config.REPORT_OUTPUT_DIR === 'string'
                  ? config.REPORT_OUTPUT_DIR
                  : path.join(baseDir, 'relatorios');
              await import('node:fs').then((fs) => fs.promises.mkdir(dir, { recursive: true }));
              const nome = `oraculo-poda-${ts}`;
              await gerarRelatorioPodaMarkdown(path.join(dir, `${nome}.md`), [], [], {
                simulado: !opts.force,
              });
              await gerarRelatorioPodaJson(path.join(dir, `${nome}.json`), [], []);
              log.sucesso(`Relatórios de poda exportados para: ${dir}`);
            } catch (e) {
              log.erro(`Falha ao exportar relatórios de poda: ${(e as Error).message}`);
            }
          }
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
          if (config.REPORT_EXPORT_ENABLED) {
            try {
              const ts = new Date().toISOString().replace(/[:.]/g, '-');
              const dir =
                typeof config.REPORT_OUTPUT_DIR === 'string'
                  ? config.REPORT_OUTPUT_DIR
                  : path.join(baseDir, 'relatorios');
              await import('node:fs').then((fs) => fs.promises.mkdir(dir, { recursive: true }));
              const nome = `oraculo-poda-${ts}`;
              const podados = resultadoPoda.arquivosOrfaos.map((f) => ({
                arquivo: f.arquivo,
                motivo: f.referenciado ? 'inativo' : 'órfão',
                detectedAt: Date.now(),
                scheduleAt: Date.now(),
              }));
              await gerarRelatorioPodaMarkdown(path.join(dir, `${nome}.md`), podados, [], {
                simulado: false,
              });
              await gerarRelatorioPodaJson(path.join(dir, `${nome}.json`), podados, []);
              log.sucesso(`Relatórios de poda exportados para: ${dir}`);
            } catch (e) {
              log.erro(`Falha ao exportar relatórios de poda: ${(e as Error).message}`);
            }
          }
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
