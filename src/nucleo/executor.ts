// SPDX-License-Identifier: MIT
import crypto from 'node:crypto';
import XXH from 'xxhashjs';
import type {
  ContextoExecucao,
  FileEntryWithAst,
  Ocorrencia,
  ResultadoInquisicao,
  Tecnica,
} from '../tipos/tipos.js';
import { MetricaAnalista, MetricaExecucao, ocorrenciaErroAnalista } from '../tipos/tipos.js';
import { lerEstado, salvarEstado } from '../zeladores/util/persistencia.js';
import { config } from './constelacao/cosmos.js';
import { formatMs } from './constelacao/format.js';
import { log } from './constelacao/log.js';
// Fallback para infoDestaque quando mock de log não implementa
const __infoD = (msg: string) => {
  const l = log as unknown as { infoDestaque?: (m: string) => void; info: (m: string) => void };
  if (typeof l.infoDestaque === 'function') return l.infoDestaque(msg);
  return l.info(msg);
};

export async function executarInquisicao(
  fileEntriesComAst: FileEntryWithAst[],
  tecnicas: Tecnica[],
  baseDir: string,
  guardianResultado: unknown,
  opts?: { verbose?: boolean; compact?: boolean },
): Promise<ResultadoInquisicao> {
  const ocorrencias: Ocorrencia[] = [];
  const metricasAnalistas: MetricaAnalista[] = [];
  const arquivosValidosSet = new Set(fileEntriesComAst.map((f) => f.relPath));
  const contextoGlobal: ContextoExecucao = {
    baseDir,
    arquivos: fileEntriesComAst,
    ambiente: {
      arquivosValidosSet,
      guardian: guardianResultado,
    },
  };
  const inicioExecucao = performance.now();

  // Incremental: carregar estado anterior
  type EstadoIncremental = {
    versao: number;
    arquivos: Record<
      string,
      {
        hash: string;
        ocorrencias: Ocorrencia[];
        analistas?: Record<string, { ocorrencias: number; duracaoMs: number }>;
        ultimaExecucaoMs?: number;
        reaproveitadoCount?: number;
      }
    >;
    estatisticas?: {
      totalReaproveitamentos?: number;
      totalArquivosProcessados?: number;
      ultimaDuracaoMs?: number;
    };
  };
  let estadoIncremental: EstadoIncremental | null = null;
  if (config.ANALISE_INCREMENTAL_ENABLED) {
    const lido = await lerEstado<EstadoIncremental>(config.ANALISE_INCREMENTAL_STATE_PATH).catch(
      () => null,
    );
    if (lido && lido.versao === config.ANALISE_INCREMENTAL_VERSION) estadoIncremental = lido;
  }
  const novoEstado: EstadoIncremental = {
    versao: config.ANALISE_INCREMENTAL_VERSION,
    arquivos: {},
    estatisticas: { totalReaproveitamentos: 0, totalArquivosProcessados: 0, ultimaDuracaoMs: 0 },
  };

  function hashConteudo(c: string) {
    try {
      // Usa xxhash64 (seed arbitrária) para performance
      return XXH.h64(c, 0xabcd).toString(16);
    } catch {
      // Fallback para sha1 se algo der errado
      return crypto.createHash('sha1').update(c).digest('hex');
    }
  }

  // Técnicas globais
  for (const tecnica of tecnicas) {
    if (tecnica.global) {
      // início medido apenas por analista específico (inicioAnalista)
      try {
        const inicioAnalista = performance.now();
        const resultado = await tecnica.aplicar('', '', null, undefined, contextoGlobal);
        if (resultado) {
          ocorrencias.push(...(Array.isArray(resultado) ? resultado : [resultado]));
        }
        const duracaoMs = performance.now() - inicioAnalista;
        if (config.ANALISE_METRICAS_ENABLED) {
          metricasAnalistas.push({
            nome: tecnica.nome || 'desconhecido',
            duracaoMs,
            ocorrencias: Array.isArray(resultado) ? resultado.length : resultado ? 1 : 0,
            global: true,
          });
        }
        if (opts?.verbose) {
          log.sucesso(`Técnica global "${tecnica.nome}"`);
        }
        if (config.LOG_ESTRUTURADO) {
          log.info(
            JSON.stringify({
              tipo: 'analista',
              escopo: 'global',
              nome: tecnica.nome,
              duracaoMs,
              ocorrencias: metricasAnalistas.at(-1)?.ocorrencias,
            }),
          );
        }
      } catch (error) {
        const err = error as Error;
        log.erro(`❌ Erro na técnica global '${tecnica.nome}': ${err.message}`);
        if (err.stack && opts?.verbose) log.info(err.stack);
        ocorrencias.push(
          ocorrenciaErroAnalista({
            mensagem: `Falha na técnica global '${tecnica.nome}': ${err.message}`,
            relPath: '[execução global]',
            origem: tecnica.nome,
          }),
        );
      }
    }
  }

  // Técnicas por arquivo
  let arquivoAtual = 0;
  const totalArquivos = fileEntriesComAst.length;
  // Limiar para logs detalhados por arquivo
  const LIMIAR_DETALHE_TOTAL = 100; // até aqui permite detalhar por arquivo
  const LIMIAR_DETALHE_THROTTLED_MAX = 250; // até aqui permite "Arquivo X/Y" com throttle
  // Define passo de logging quando em modo verbose para evitar spam massivo
  function passoDeLog(total: number): number {
    // Assumimos faixas: até 100 => cada arquivo; 101-250 => a cada 10; 251-500 => a cada 25; >500 => a cada 100
    if (total <= 100) return 1;
    if (total <= 250) return 10;
    if (total <= 500) return 25;
    return 100;
  }
  const frames = ['->', '=>', '>>', '=>'] as const;
  const stepVerbose = passoDeLog(totalArquivos);
  const detalharPorArquivo = (opts?.verbose ?? false) && totalArquivos <= LIMIAR_DETALHE_TOTAL;
  const permitirArquivoXY =
    (opts?.verbose ?? false) && totalArquivos <= LIMIAR_DETALHE_THROTTLED_MAX;
  for (const entry of fileEntriesComAst) {
    arquivoAtual++;
    if (opts?.compact) {
      if (arquivoAtual === totalArquivos) {
        log.info(`Arquivos analisados: ${totalArquivos}`);
      }
    } else if (opts?.verbose) {
      // Em verbose: detalha por arquivo somente até o limiar; entre 101-250 mostra "Arquivo X/Y" com throttle; acima disso, só resumo de progresso.
      if (permitirArquivoXY) {
        if (
          arquivoAtual === 1 ||
          arquivoAtual % stepVerbose === 0 ||
          arquivoAtual === totalArquivos
        ) {
          const seta = frames[arquivoAtual % frames.length];
          log.info(`${seta} Arquivo ${arquivoAtual}/${totalArquivos}: ${entry.relPath}`);
        }
      } else {
        if (
          arquivoAtual === 1 ||
          arquivoAtual % stepVerbose === 0 ||
          arquivoAtual === totalArquivos
        ) {
          log.info(`Arquivos analisados: ${arquivoAtual}/${totalArquivos}`);
        }
      }
    } else if (arquivoAtual % 10 === 0 || arquivoAtual === totalArquivos) {
      if (arquivoAtual === totalArquivos) {
        __infoD(`Arquivos analisados: ${arquivoAtual}/${totalArquivos}`);
      } else {
        log.info(`Arquivos analisados: ${arquivoAtual}/${totalArquivos}`);
      }
    }
    // Verifica incremento
    const conteudo = entry.content ?? '';
    const h = hashConteudo(conteudo);
    const cacheAnterior = estadoIncremental?.arquivos[entry.relPath];
    let reaproveitou = false;
    if (config.ANALISE_INCREMENTAL_ENABLED && cacheAnterior && cacheAnterior.hash === h) {
      // Reaproveita ocorrências anteriores do arquivo
      ocorrencias.push(...cacheAnterior.ocorrencias);
      novoEstado.arquivos[entry.relPath] = cacheAnterior; // mantém
      novoEstado.arquivos[entry.relPath].reaproveitadoCount =
        (cacheAnterior.reaproveitadoCount || 0) + 1;
      if (novoEstado.estatisticas) {
        novoEstado.estatisticas.totalReaproveitamentos =
          (novoEstado.estatisticas.totalReaproveitamentos || 0) + 1;
      }
      reaproveitou = true;
      if (detalharPorArquivo) log.info(`♻️ Reaproveitado ${entry.relPath} (incremental)`);
      if (config.LOG_ESTRUTURADO) {
        log.info(
          JSON.stringify({
            tipo: 'incremental-reuse',
            arquivo: entry.relPath,
            ocorrencias: cacheAnterior.ocorrencias.length,
          }),
        );
      }
    }
    if (reaproveitou) continue; // pula analistas

    for (const tecnica of tecnicas) {
      if (tecnica.global) continue;
      if (tecnica.test && !tecnica.test(entry.relPath)) continue;

      // início medido apenas por analista específico (inicioAnalista)
      try {
        const inicioAnalista = performance.now();
        const resultado = await tecnica.aplicar(
          entry.content ?? '',
          entry.relPath,
          entry.ast ?? null,
          entry.fullPath,
          contextoGlobal,
        );
        if (resultado) {
          const arr = Array.isArray(resultado) ? resultado : [resultado];
          ocorrencias.push(...arr);
        }
        const duracaoMs = performance.now() - inicioAnalista;
        if (config.ANALISE_METRICAS_ENABLED) {
          metricasAnalistas.push({
            nome: tecnica.nome || 'desconhecido',
            duracaoMs,
            ocorrencias: Array.isArray(resultado) ? resultado.length : resultado ? 1 : 0,
            global: false,
          });
        }
        if (detalharPorArquivo) {
          log.info(`📄 '${tecnica.nome}' analisou ${entry.relPath} em ${formatMs(duracaoMs)}`);
        }
        if (config.LOG_ESTRUTURADO) {
          log.info(
            JSON.stringify({
              tipo: 'analista',
              arquivo: entry.relPath,
              nome: tecnica.nome,
              duracaoMs,
              ocorrencias: metricasAnalistas.at(-1)?.ocorrencias,
            }),
          );
        }
      } catch (error) {
        const err = error as Error;
        log.erro(`❌ Erro em '${tecnica.nome}' para ${entry.relPath}: ${err.message}`);
        if (err.stack && opts?.verbose) log.info(err.stack);
        ocorrencias.push(
          ocorrenciaErroAnalista({
            mensagem: `Falha na técnica '${tecnica.nome}' para ${entry.relPath}: ${err.message}`,
            relPath: entry.relPath,
            origem: tecnica.nome,
          }),
        );
      }
    }
    // Salva estado incremental do arquivo processado
    if (config.ANALISE_INCREMENTAL_ENABLED) {
      const ocorrArq = ocorrencias.filter((o) => o.relPath === entry.relPath);
      // Extrai métricas por analista específicas do arquivo
      const analistasArquivo: Record<string, { ocorrencias: number; duracaoMs: number }> = {};
      for (const m of metricasAnalistas.filter((m) => !m.global)) {
        analistasArquivo[m.nome] = { ocorrencias: m.ocorrencias, duracaoMs: m.duracaoMs };
      }
      novoEstado.arquivos[entry.relPath] = {
        hash: h,
        ocorrencias: ocorrArq,
        analistas: analistasArquivo,
        ultimaExecucaoMs: Date.now(),
        reaproveitadoCount: 0,
      };
      if (novoEstado.estatisticas) {
        novoEstado.estatisticas.totalArquivosProcessados =
          (novoEstado.estatisticas.totalArquivosProcessados || 0) + 1;
      }
    }
  }

  const fimExecucao = performance.now();
  const duracaoMs = Math.round(fimExecucao - inicioExecucao);

  // Agregação de métricas
  let metricasExecucao: MetricaExecucao | null = null;
  if (config.ANALISE_METRICAS_ENABLED) {
    interface MetricasGlobais {
      parsingTimeMs: number;
      cacheHits: number;
      cacheMiss: number;
    }
    const metricasGlobais: MetricasGlobais = ((globalThis as unknown as Record<string, unknown>)
      .__ORACULO_METRICAS__ as MetricasGlobais) || { parsingTimeMs: 0, cacheHits: 0, cacheMiss: 0 };
    metricasExecucao = {
      totalArquivos: fileEntriesComAst.length,
      tempoParsingMs: Math.round(metricasGlobais.parsingTimeMs),
      tempoAnaliseMs: duracaoMs,
      cacheAstHits: metricasGlobais.cacheHits,
      cacheAstMiss: metricasGlobais.cacheMiss,
      analistas: metricasAnalistas,
    };
    if (config.LOG_ESTRUTURADO) {
      log.info(JSON.stringify({ tipo: 'metricas', ...metricasExecucao }));
    }
    // Persistir histórico
    try {
      const historicoPath = config.ANALISE_METRICAS_HISTORICO_PATH as string | undefined;
      if (historicoPath) {
        type RegistroHistorico = MetricaExecucao & { timestamp: number };
        let anterior = await lerEstado<unknown>(historicoPath).catch(
          () => [] as RegistroHistorico[],
        );
        const lista = Array.isArray(anterior) ? (anterior as RegistroHistorico[]) : [];
        lista.push({ ...metricasExecucao, timestamp: Date.now() });
        const max = config.ANALISE_METRICAS_HISTORICO_MAX || 200;
        const recortado = lista.slice(-max);
        await salvarEstado(historicoPath, recortado);
      }
    } catch (e) {
      if (config.DEV_MODE)
        log.erro(`Falha ao persistir histórico de métricas: ${(e as Error).message}`);
    }
  }

  // Persistir incremental
  if (config.ANALISE_INCREMENTAL_ENABLED) {
    if (novoEstado.estatisticas) {
      novoEstado.estatisticas.ultimaDuracaoMs = duracaoMs;
    }
    await salvarEstado(config.ANALISE_INCREMENTAL_STATE_PATH, novoEstado);
    if (config.LOG_ESTRUTURADO) {
      log.info(
        JSON.stringify({
          tipo: 'incremental-salvo',
          arquivos: Object.keys(novoEstado.arquivos).length,
          totalReaproveitamentos: novoEstado.estatisticas?.totalReaproveitamentos,
          processados: novoEstado.estatisticas?.totalArquivosProcessados,
        }),
      );
    }
  }

  return {
    totalArquivos: fileEntriesComAst.length,
    arquivosAnalisados: fileEntriesComAst.map((e) => e.relPath),
    ocorrencias,
    timestamp: Date.now(),
    duracaoMs,
    metricas: metricasExecucao || undefined,
  };
}

// Hook simples para expor última métrica de execução (consumido por comando perf baseline)
export function registrarUltimasMetricas(metricas: MetricaExecucao | undefined) {
  try {
    (
      globalThis as unknown as { __ULTIMAS_METRICAS_ORACULO__?: MetricaExecucao | null }
    ).__ULTIMAS_METRICAS_ORACULO__ = metricas || null;
  } catch {
    /* ignore */
  }
}
