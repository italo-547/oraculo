// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { formatPct } from '../nucleo/constelacao/format.js';
import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';

// Tipagens reutilizadas (espelho parcial de MetricaExecucao para evitar dependência circular leve)
interface MetricaAnalistaLike {
  nome: string;
  duracaoMs: number;
  ocorrencias: number;
}
interface MetricaExecucaoLike {
  totalArquivos: number;
  tempoParsingMs: number;
  tempoAnaliseMs: number;
  cacheAstHits: number;
  cacheAstMiss: number;
  analistas: MetricaAnalistaLike[];
}

interface SnapshotPerf {
  tipo: 'baseline';
  timestamp: string;
  commit?: string;
  node: string;
  totalArquivos?: number;
  tempoParsingMs?: number;
  tempoAnaliseMs?: number;
  cacheAstHits?: number;
  cacheAstMiss?: number;
  analistasTop?: { nome: string; duracaoMs: number; ocorrencias: number }[];
  hashConteudo?: string; // hash de métricas para identificação rápida
}

async function obterCommit(): Promise<string | undefined> {
  try {
    // usar helper seguro
    const { executarShellSeguro } = await import('../nucleo/util/exec-safe.js');
    return executarShellSeguro('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

function calcularHash(snapshot: Omit<SnapshotPerf, 'hashConteudo'>) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(snapshot, Object.keys(snapshot).sort()))
    .digest('hex')
    .slice(0, 10);
}

async function gerarBaseline(destDir: string, metricas?: Partial<MetricaExecucaoLike>) {
  const commit = await obterCommit();
  const base: Omit<SnapshotPerf, 'hashConteudo'> = {
    tipo: 'baseline',
    timestamp: new Date().toISOString(),
    commit,
    node: process.version,
    totalArquivos: metricas?.totalArquivos,
    tempoParsingMs: metricas?.tempoParsingMs,
    tempoAnaliseMs: metricas?.tempoAnaliseMs,
    cacheAstHits: metricas?.cacheAstHits,
    cacheAstMiss: metricas?.cacheAstMiss,
    analistasTop: Array.isArray(metricas?.analistas)
      ? metricas.analistas
          .slice()
          .sort((a, b) => b.duracaoMs - a.duracaoMs)
          .slice(0, 5)
          .map((a) => ({ nome: a.nome, duracaoMs: a.duracaoMs, ocorrencias: a.ocorrencias }))
      : undefined,
  };
  const hashConteudo = calcularHash(base);
  const snapshot: SnapshotPerf = { ...base, hashConteudo };
  await fs.mkdir(destDir, { recursive: true });
  const nome = `baseline-${Date.now()}.json`;
  await salvarEstado(path.join(destDir, nome), snapshot);
  return snapshot;
}

async function carregarSnapshots(dir: string): Promise<SnapshotPerf[]> {
  try {
    const arquivos = await fs.readdir(dir);
    const jsons = arquivos.filter((f) => f.endsWith('.json'));
    const out: SnapshotPerf[] = [];
    for (const f of jsons) {
      try {
        const parsed = await lerEstado<SnapshotPerf>(path.join(dir, f));
        if (parsed && parsed.tipo === 'baseline') out.push(parsed);
      } catch {
        /* ignore */
      }
    }
    return out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } catch {
    return [];
  }
}

function diffPercent(a?: number, b?: number) {
  if (!a && !b) return 0;
  if (!a || !b) return 0;
  if (a === 0) return 0;
  return ((b - a) / a) * 100;
}

function compararSnapshots(base: SnapshotPerf, atual: SnapshotPerf) {
  const campos: (keyof SnapshotPerf)[] = [
    'tempoParsingMs',
    'tempoAnaliseMs',
    'cacheAstHits',
    'cacheAstMiss',
    'totalArquivos',
  ];
  const diffs = campos.map((c) => {
    const anterior = base[c] as number | undefined;
    const novo = atual[c] as number | undefined;
    return { campo: c, anterior, novo, variacaoPct: diffPercent(anterior, novo) };
  });
  return diffs;
}

export function comandoPerf() {
  /* istanbul ignore next */
  if (false) 0;
  return new Command('perf')
    .description('Operações de baseline e comparação de performance sintética')
    .option('-d, --dir <dir>', 'Diretório de snapshots', config.PERF_SNAPSHOT_DIR)
    .option('-j, --json', 'Saída JSON')
    .option('-l, --limite <n>', 'Limite para regressão (%)', (v) => Number(v), 30)
    .addCommand(
      new Command('baseline')
        .description(
          'Gera uma nova baseline. Usa métricas globais da última execução se disponíveis.',
        )
        .action(async (opts, cmd) => {
          const parent = cmd.parent?.opts?.() || {};
          const dir = parent.dir ? String(parent.dir) : config.PERF_SNAPSHOT_DIR;
          const metricas = (
            globalThis as unknown as {
              __ULTIMAS_METRICAS_ORACULO__?: Partial<MetricaExecucaoLike> | null;
            }
          ).__ULTIMAS_METRICAS_ORACULO__;
          const snap = await gerarBaseline(dir, metricas || undefined);
          if (parent.json) {
            console.log(JSON.stringify({ gerado: true, snapshot: snap }, null, 2));
          } else {
            log.sucesso(
              `Baseline gerada: commit=${snap.commit || 'n/a'} parsing=${snap.tempoParsingMs}ms analise=${snap.tempoAnaliseMs}ms`,
            );
          }
        }),
    )
    .addCommand(
      new Command('compare')
        .description('Compara os dois últimos snapshots e sinaliza regressão')
        .action(async (opts, cmd) => {
          const parent = cmd.parent?.opts?.() || {};
          const dir = parent.dir ? String(parent.dir) : config.PERF_SNAPSHOT_DIR;
          const limite = parent.limite;
          const snaps = await carregarSnapshots(dir);
          if (snaps.length < 2) {
            const msg = 'Menos de dois snapshots para comparar';
            if (parent.json) console.log(JSON.stringify({ erro: msg }));
            else log.aviso(msg);
            return;
          }
          const anterior = snaps[snaps.length - 2];
          const atual = snaps[snaps.length - 1];
          const diffs = compararSnapshots(anterior, atual);
          const regressao = diffs
            .filter((d) => d.campo === 'tempoAnaliseMs' || d.campo === 'tempoParsingMs')
            .some((d) => d.variacaoPct > limite);
          if (parent.json) {
            console.log(
              JSON.stringify(
                {
                  base: anterior.hashConteudo,
                  atual: atual.hashConteudo,
                  limite,
                  diffs,
                  regressao,
                },
                null,
                2,
              ),
            );
          } else {
            log.info('Comparação entre snapshots:');
            diffs.forEach((d) => {
              log.info(
                `  ${d.campo}: ${d.anterior ?? '-'} => ${d.novo ?? '-'} (${formatPct(d.variacaoPct)})`,
              );
            });
            if (regressao) log.aviso(`⚠️ Regressão acima de ${limite}% detectada.`);
            else log.sucesso('✅ Sem regressões significativas.');
          }
        }),
    );
}
