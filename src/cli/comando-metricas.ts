// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import path from 'node:path';
import { lerEstado, salvarEstado } from '@zeladores/util/persistencia.js';
import { log } from '@nucleo/constelacao/log.js';
import { config } from '@nucleo/constelacao/cosmos.js';
import { formatMs } from '@nucleo/constelacao/format.js';
import type { MetricaExecucao } from '@tipos/tipos.js';

interface RegistroHistorico extends MetricaExecucao {
  timestamp: number;
}

const formatarDuracao = (ms: number) => formatMs(ms);

function agregados(historico: RegistroHistorico[]) {
  if (!historico.length) return null;
  const total = historico.length;
  const somaAnalise = historico.reduce((acc, h) => acc + h.tempoAnaliseMs, 0);
  const somaParsing = historico.reduce((acc, h) => acc + h.tempoParsingMs, 0);
  const analistasMap = new Map<
    string,
    { totalMs: number; execucoes: number; ocorrencias: number }
  >();
  for (const h of historico) {
    for (const a of h.analistas) {
      const dado = analistasMap.get(a.nome) || { totalMs: 0, execucoes: 0, ocorrencias: 0 };
      dado.totalMs += a.duracaoMs;
      dado.execucoes += 1;
      dado.ocorrencias += a.ocorrencias;
      analistasMap.set(a.nome, dado);
    }
  }
  const analistasOrdenados = [...analistasMap.entries()]
    .sort((a, b) => b[1].totalMs - a[1].totalMs)
    .slice(0, 5)
    .map(([nome, d]) => ({
      nome,
      totalMs: d.totalMs,
      mediaMs: d.totalMs / d.execucoes,
      execucoes: d.execucoes,
      ocorrencias: d.ocorrencias,
    }));
  return {
    totalExecucoes: total,
    mediaAnaliseMs: somaAnalise / total,
    mediaParsingMs: somaParsing / total,
    topAnalistas: analistasOrdenados,
  };
}

export function comandoMetricas() {
  return new Command('metricas')
    .description('Inspeciona histórico de métricas de execuções anteriores')
    .option('-j, --json', 'Saída em JSON bruto (historico e agregados)')
    .option(
      '-l, --limite <n>',
      'Quantidade de registros mais recentes (default 10)',
      (v) => Number(v),
      10,
    )
    .option('-e, --export <arquivo>', 'Exporta histórico completo em JSON para arquivo')
    .option('-a, --analistas', 'Exibe tabela agregada por analista (top 5)')
    .action(
      async (opts: { json?: boolean; limite?: number; export?: string; analistas?: boolean }) => {
        const caminho = config.ANALISE_METRICAS_HISTORICO_PATH;
        const historico = await lerEstado<RegistroHistorico[]>(caminho).catch(() => []);
        const lista = Array.isArray(historico) ? historico : [];
        const ultimos = opts.limite ? lista.slice(-opts.limite) : lista;
        const agg = agregados(lista) || undefined;

        if (opts.export) {
          const destino = path.isAbsolute(opts.export)
            ? opts.export
            : path.join(process.cwd(), opts.export);
          await salvarEstado(destino, {
            exportadoEm: new Date().toISOString(),
            total: lista.length,
            historico: lista,
          });
          log.sucesso(`📦 Histórico de métricas exportado para ${destino}`);
          return;
        }

        if (opts.json) {
          // Emite JSON puro (sem prefixos de log) para facilitar piping / CI
          console.log(
            JSON.stringify(
              { total: lista.length, limite: opts.limite, historico: ultimos, agregados: agg },
              null,
              2,
            ),
          );
          return;
        }

        log.info(`\n📊 Execuções registradas: ${lista.length}`);
        if (!lista.length) {
          log.aviso(
            'Nenhum histórico de métricas encontrado ainda. Execute um diagnóstico com --metricas ativo.',
          );
          return;
        }
        for (const h of ultimos) {
          const data = new Date(h.timestamp).toISOString();
          log.info(
            `- ${data} | arquivos=${h.totalArquivos} analise=${formatarDuracao(h.tempoAnaliseMs)} parsing=${formatarDuracao(h.tempoParsingMs)} cache(h/m)=${h.cacheAstHits}/${h.cacheAstMiss}`,
          );
        }
        if (opts.analistas && agg) {
          log.info('\n🧠 Top analistas (por tempo acumulado):');
          for (const a of agg.topAnalistas) {
            log.info(
              `  • ${a.nome} total=${formatMs(a.totalMs)} média=${formatMs(a.mediaMs)} exec=${a.execucoes} ocorr=${a.ocorrencias}`,
            );
          }
        }
        if (agg) {
          log.info(
            `\nMédias: análise=${formatMs(agg.mediaAnaliseMs)} parsing=${formatMs(agg.mediaParsingMs)}`,
          );
        }
      },
    );
}
