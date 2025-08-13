import { registroAnalistas } from '../analistas/registry.js';
import * as path from 'path';
import { scanRepository } from './scanner.js';
import { decifrarSintaxe } from './parser.js';
import { executarInquisicao as executarExecucao, registrarUltimasMetricas } from './executor.js';
import { log } from './constelacao/log.js';
import { config } from './constelacao/cosmos.js';
import { lerEstado } from '../zeladores/util/persistencia.js';
import { promises as fs } from 'node:fs';

import type {
  FileEntryWithAst,
  FileEntry,
  InquisicaoOptions,
  Tecnica,
  ResultadoInquisicaoCompleto,
} from '../tipos/tipos.js';
import { ocorrenciaParseErro, OcorrenciaParseErro } from '../tipos/tipos.js';

const EXTENSOES_COM_AST = new Set(
  Array.isArray(config.SCANNER_EXTENSOES_COM_AST)
    ? config.SCANNER_EXTENSOES_COM_AST
    : ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
);

export const tecnicas: Tecnica[] = registroAnalistas as Tecnica[];

export async function prepararComAst(
  entries: FileEntry[],
  baseDir: string,
): Promise<FileEntryWithAst[]> {
  // Cache em memória (process-level). Chave: relPath
  // Guarda: { mtimeMs, size, ast }
  type CacheValor = {
    mtimeMs: number;
    size: number;
    ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined;
  };
  interface MetricasGlobais {
    parsingTimeMs: number;
    cacheHits: number;
    cacheMiss: number;
  }
  const globalStore = globalThis as unknown as Record<string, unknown>;
  const cache: Map<string, CacheValor> =
    (globalStore.__ORACULO_AST_CACHE__ as Map<string, CacheValor>) || new Map();
  if (!globalStore.__ORACULO_AST_CACHE__) globalStore.__ORACULO_AST_CACHE__ = cache;
  const metricas: MetricasGlobais = (globalStore.__ORACULO_METRICAS__ as MetricasGlobais) || {
    parsingTimeMs: 0,
    cacheHits: 0,
    cacheMiss: 0,
  };
  // Reset métricas de parsing a cada preparação completa
  metricas.parsingTimeMs = 0;
  metricas.cacheHits = 0;
  metricas.cacheMiss = 0;
  globalStore.__ORACULO_METRICAS__ = metricas;

  return Promise.all(
    entries.map(async (entry): Promise<FileEntryWithAst> => {
      let ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined =
        undefined;
      const ext = path.extname(entry.relPath);
      const absPath =
        typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath);
      let stats: import('node:fs').Stats | undefined;
      try {
        stats = await fs.stat(absPath);
      } catch {
        stats = undefined;
      }

      if (entry.content && EXTENSOES_COM_AST.has(ext)) {
        const chave = entry.relPath;
        if (config.ANALISE_AST_CACHE_ENABLED && stats) {
          const anterior = cache.get(chave);
          if (anterior && anterior.mtimeMs === stats.mtimeMs && anterior.size === stats.size) {
            // Reaproveita sentinel/AST anterior (não precisamos necessariamente do NodePath completo
            // para todos analistas; sentinel truthy evita novo parsing).
            // Sentinel: usamos um objeto vazio tipado para indicar que já houve parsing prévio
            ast =
              anterior.ast ||
              ({} as unknown as import('@babel/traverse').NodePath<import('@babel/types').Node>);
            metricas.cacheHits++;
          }
        }
        try {
          if (!ast) {
            const inicioParse = performance.now();
            const parsed = await decifrarSintaxe(entry.content, ext);
            if (parsed && typeof parsed === 'object') {
              // parsed pode ser BabelFile; manter ast undefined (NodePath não necessário para todos analistas)
              // Somente registra erro se parser retornou null (falha real)
              // Usamos sentinel somente se objeto não for vazio (possui alguma chave), para distinguir de forma inválida
              if (Object.keys(parsed as unknown as Record<string, unknown>).length > 0) {
                // Sentinel convertida para o tipo NodePath via unknown cast – suficiente para diferenciar truthy
                ast = {} as unknown as import('@babel/traverse').NodePath<
                  import('@babel/types').Node
                >;
              }
            } else if (parsed == null) {
              const globalStore2 = globalStore as unknown as Record<string, unknown>;
              const lista =
                (globalStore2.__ORACULO_PARSE_ERROS__ as OcorrenciaParseErro[] | undefined) || [];
              lista.push(
                ocorrenciaParseErro({
                  mensagem: 'Erro de parsing: AST não gerada (código possivelmente inválido).',
                  relPath: entry.relPath,
                  origem: 'parser',
                }),
              );
              globalStore2.__ORACULO_PARSE_ERROS__ = lista;
            }
            metricas.parsingTimeMs += performance.now() - inicioParse;
            metricas.cacheMiss++;
            if (config.ANALISE_AST_CACHE_ENABLED && stats) {
              cache.set(entry.relPath, { mtimeMs: stats.mtimeMs, size: stats.size, ast });
            }
          }
        } catch (e) {
          const err = e as Error;
          log.erro(`Falha ao gerar AST para ${entry.relPath}: ${err.message}`);
          // Registra ocorrência de parse erro
          const lista =
            (globalStore.__ORACULO_PARSE_ERROS__ as OcorrenciaParseErro[] | undefined) || [];
          lista.push(
            ocorrenciaParseErro({
              mensagem: `Erro de parsing: ${err.message}`,
              relPath: entry.relPath,
              origem: 'parser',
            }),
          );
          globalStore.__ORACULO_PARSE_ERROS__ = lista;
        }
      }

      return {
        ...entry,
        ast,
        fullPath:
          typeof entry.fullPath === 'string'
            ? entry.fullPath
            : path.resolve(baseDir, entry.relPath),
      };
    }),
  );
}

export async function iniciarInquisicao(
  baseDir: string = process.cwd(),
  options: InquisicaoOptions = {},
): Promise<ResultadoInquisicaoCompleto> {
  const { includeContent = true, incluirMetadados = true, skipExec = false } = options;
  log.info(`🔍 Iniciando a Inquisição do Oráculo em: ${baseDir}`);

  const fileMap = await scanRepository(baseDir, {
    includeContent,
    onProgress: (msg) => {
      // Só exibe diretórios e erros, e em formato legível por máquina/pessoa
      try {
        const obj = JSON.parse(msg);
        if (obj.tipo === 'diretorio') {
          if (!config.COMPACT_MODE) {
            log.info(`Examinando diretório: ${obj.caminho}`);
          } else {
            // Em modo compacto, mostra apenas a cada N diretórios para reduzir ruído
            const g = globalThis as unknown as { __ORACULO_DIR_COUNT__?: number };
            g.__ORACULO_DIR_COUNT__ = (g.__ORACULO_DIR_COUNT__ || 0) + 1;
            const n = g.__ORACULO_DIR_COUNT__;
            const STEP = 10;
            if (n % STEP === 1) {
              log.info(`Examinando diretórios... (${n})`);
            }
          }
        } else if (obj.tipo === 'erro') {
          log.erro(`Erro ao ${obj.acao} ${obj.caminho}: ${obj.mensagem}`);
        }
      } catch {
        // fallback para logs antigos
        if (msg && msg.includes('⚠️')) log.aviso(msg);
      }
    },
  });
  let fileEntries: FileEntryWithAst[];

  let entriesBase = Object.values(fileMap);
  // Filtra arquivos meta que não devem influenciar priorização (ainda são analisados, mas não ranqueados no topo)
  const META_PATTERNS = [/^\.github\//, /^docs\//, /^\.oraculo\//, /^\.vscode\//];
  function isMeta(rel: string): boolean {
    const norm = rel.replace(/\\/g, '/');
    if (META_PATTERNS.some((r) => r.test(norm))) return true;
    if (!norm.startsWith('src/') && /\.(md|MD)$/.test(norm)) return true;
    if (
      !norm.startsWith('src/') &&
      /^(package|tsconfig|eslint|vitest)\.(json|js|cjs|mjs)$/i.test(norm)
    )
      return true;
    if (/^\.eslint-report\.json$/i.test(norm)) return true;
    if (/^\.gitignore$/i.test(norm)) return true;
    if (norm.startsWith('.oraculo/')) return true;
    return false;
  }
  const metaSet = new Set(entriesBase.filter((e) => isMeta(e.relPath)).map((e) => e.relPath));
  // Priorização (usa estado incremental anterior somente para ordenar)
  if (config.ANALISE_PRIORIZACAO_ENABLED && config.ANALISE_INCREMENTAL_STATE_PATH) {
    try {
      interface EstadoIncArquivo {
        hash: string;
        ocorrencias: OcorrenciaParseErro[];
        analistas?: Record<string, { ocorrencias: number; duracaoMs: number }>;
        reaproveitadoCount?: number;
      }
      type EstadoIncremental = { arquivos: Record<string, EstadoIncArquivo> };
      const inc = await lerEstado<EstadoIncremental>(config.ANALISE_INCREMENTAL_STATE_PATH).catch(
        () => null,
      );
      if (inc && inc.arquivos) {
        const pesos = (config.ANALISE_PRIORIZACAO_PESOS || {
          duracaoMs: 1,
          ocorrencias: 2,
          penalidadeReuso: 0.5,
        }) as { duracaoMs: number; ocorrencias: number; penalidadeReuso: number };
        const scored = entriesBase.map((e) => {
          const hist = inc.arquivos[e.relPath];
          if (!hist) return { ...e, __score: 0 } as FileEntry & { __score: number };
          let dur = 0;
          let occ = 0;
          if (hist.analistas) {
            for (const a of Object.values(hist.analistas)) {
              dur += a.duracaoMs;
              occ += a.ocorrencias;
            }
          } else {
            occ = hist.ocorrencias?.length || 0;
          }
          const reuso = hist.reaproveitadoCount || 0;
          const score =
            dur * pesos.duracaoMs + occ * pesos.ocorrencias - reuso * pesos.penalidadeReuso;
          return { ...e, __score: score } as FileEntry & { __score: number };
        });
        scored.sort(
          (a, b) =>
            (b as unknown as { __score: number }).__score -
            (a as unknown as { __score: number }).__score,
        );
        // Reorganiza empurrando meta para o final
        const prioritarios: (FileEntry & { __score: number })[] = [];
        const metas: (FileEntry & { __score: number })[] = [];
        for (const s of scored) (metaSet.has(s.relPath) ? metas : prioritarios).push(s);
        const reconstituido = [...prioritarios, ...metas];
        entriesBase = reconstituido as unknown as typeof entriesBase;
        const somentePrioritarios = reconstituido.filter((e) => !metaSet.has(e.relPath));
        if (config.LOG_ESTRUTURADO) {
          log.info(
            JSON.stringify({
              tipo: 'priorizacao',
              estrategia: 'historico-incremental',
              top: somentePrioritarios.slice(0, 10).map((e) => ({
                arq: e.relPath,
                score: (e as unknown as { __score: number }).__score,
              })),
              metaEmpurrados: metas.length,
            }),
          );
        } else {
          const exibidos =
            somentePrioritarios
              .slice(0, 5)
              .map((e) => e.relPath)
              .join(', ') || '—';
          log.info(`🧮 Priorização aplicada (top 5 sem meta): ${exibidos}`);
          if (metas.length) {
            log.info(`   (ℹ️ ${metas.length} arquivos meta movidos para o final da fila)`);
          }
        }
      }
    } catch (e) {
      if (config.DEV_MODE) log.erro(`Falha priorização: ${(e as Error).message}`);
    }
  }

  if (incluirMetadados) {
    fileEntries = await prepararComAst(entriesBase, baseDir);
  } else {
    fileEntries = entriesBase.map((entry) => ({
      ...entry,
      ast: undefined,
      fullPath:
        typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath),
    }));
  }

  // Agora fileEntries é FileEntryWithAst[]
  let totalArquivos = fileEntries.length;
  let ocorrencias: Array<OcorrenciaParseErro | import('../tipos/tipos.js').Ocorrencia> = [];
  if (!skipExec) {
    const execRes = await executarExecucao(fileEntries, tecnicas, baseDir, undefined);
    totalArquivos = execRes.totalArquivos;
    ocorrencias = execRes.ocorrencias;
  }

  // Anexa ocorrências de parse se existirem
  const parseErros: OcorrenciaParseErro[] =
    ((globalThis as unknown as Record<string, unknown>)
      .__ORACULO_PARSE_ERROS__ as OcorrenciaParseErro[]) || [];
  if (parseErros.length) {
    // Armazena contagem original para métricas (usado em saída JSON)
    (
      globalThis as unknown as { __ORACULO_PARSE_ERROS_ORIGINAIS__?: number }
    ).__ORACULO_PARSE_ERROS_ORIGINAIS__ = parseErros.length;
    if (config.PARSE_ERRO_AGRUPAR) {
      const porArquivo: Record<string, OcorrenciaParseErro[]> = {};
      for (const pe of parseErros) {
        const k = pe.relPath || '__desconhecido__';
        (porArquivo[k] = porArquivo[k] || []).push(pe);
      }
      for (const [arq, lista] of Object.entries(porArquivo)) {
        if (lista.length <= (config.PARSE_ERRO_MAX_POR_ARQUIVO || 1)) {
          ocorrencias.push(...lista);
        } else {
          // Consolida em uma única ocorrência representativa
          ocorrencias.push(
            ocorrenciaParseErro({
              mensagem: `Erros de parsing agregados: ${lista.length} ocorrências suprimidas neste arquivo (exibe 1).`,
              relPath: arq === '__desconhecido__' ? undefined : arq,
              origem: 'parser',
            }),
          );
        }
      }
    } else {
      ocorrencias.push(...parseErros);
    }
  }

  if (!skipExec) {
    log.sucesso(`🔮 Inquisição concluída. Total de ocorrências: ${ocorrencias.length}`);
  } else if (!config.COMPACT_MODE) {
    log.info(
      `🔍 Varredura concluída (execução de técnicas saltada). Arquivos: ${fileEntries.length}`,
    );
  }

  return {
    totalArquivos,
    ocorrencias,
    arquivosAnalisados: fileEntries.map((f) => f.relPath),
    timestamp: Date.now(),
    duracaoMs: 0,
    fileEntries,
    guardian: undefined,
  };
}

export { executarExecucao as executarInquisicao, registrarUltimasMetricas };
