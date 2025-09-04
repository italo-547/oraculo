// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import * as path from 'path';
import { registroAnalistas } from '@analistas/registry.js';
import { lerEstado } from '@zeladores/util/persistencia.js';
import { config } from '@nucleo/constelacao/cosmos.js';
import { log } from '@nucleo/constelacao/log.js';
import { executarInquisicao as executarExecucao, registrarUltimasMetricas } from './executor.js';
import { decifrarSintaxe } from './parser.js';
import { scanRepository } from './scanner.js';
import { isMetaPath } from '@nucleo/constelacao/paths.js';
const SIMBOLOS_FALLBACK = {
    info: 'ℹ️',
    sucesso: '✅',
    erro: '❌',
    aviso: '⚠️',
    debug: '🐞',
    fase: '🔶',
    passo: '▫️',
    scan: '🔍',
    guardian: '🛡️',
    pasta: '📂',
};
const S = typeof log.simbolos === 'object'
    ? log.simbolos
    : SIMBOLOS_FALLBACK;
// Fallback seguro para infoDestaque quando mocks de teste não expõem o método
const __infoDestaque = (mensagem) => {
    const l = log;
    if (typeof l.infoDestaque === 'function')
        return l.infoDestaque(mensagem);
    return l.info(mensagem);
};
import { ocorrenciaParseErro } from '@tipos/tipos.js';
// Extensões consideradas para tentativa de AST. Observações:
// - .d.ts é propositalmente excluída pelo parser (retorna null) e aqui não entra.
// - .map (source maps) não deve ser parseado – marcamos como NÃO pertencente ao conjunto.
const EXTENSOES_COM_AST = new Set(Array.isArray(config.SCANNER_EXTENSOES_COM_AST)
    ? config.SCANNER_EXTENSOES_COM_AST
    : ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
export const tecnicas = registroAnalistas;
export async function prepararComAst(entries, baseDir) {
    const globalStore = globalThis;
    const cache = globalStore.__ORACULO_AST_CACHE__ || new Map();
    if (!globalStore.__ORACULO_AST_CACHE__)
        globalStore.__ORACULO_AST_CACHE__ = cache;
    const metricas = globalStore.__ORACULO_METRICAS__ || {
        parsingTimeMs: 0,
        cacheHits: 0,
        cacheMiss: 0,
    };
    // Reset métricas de parsing a cada preparação completa
    metricas.parsingTimeMs = 0;
    metricas.cacheHits = 0;
    metricas.cacheMiss = 0;
    globalStore.__ORACULO_METRICAS__ = metricas;
    return Promise.all(entries.map(async (entry) => {
        let ast = undefined;
        const ext = path.extname(entry.relPath);
        const absPath = typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath);
        let stats;
        try {
            stats = await fs.stat(absPath);
        }
        catch {
            stats = undefined;
        }
        // Detecção de extensão com suporte a sufixos compostos (ex.: .d.ts, .js.map)
        const nomeLower = entry.relPath.toLowerCase();
        const extEfetiva = nomeLower.endsWith('.d.ts')
            ? '.d.ts'
            : nomeLower.endsWith('.map')
                ? '.map'
                : ext;
        if (entry.content && EXTENSOES_COM_AST.has(extEfetiva)) {
            const chave = entry.relPath;
            if (config.ANALISE_AST_CACHE_ENABLED && stats) {
                const anterior = cache.get(chave);
                if (anterior && anterior.mtimeMs === stats.mtimeMs && anterior.size === stats.size) {
                    // Se o cache tinha AST válida, reutiliza; caso contrário, mantém undefined para obrigar tentative parsing novamente.
                    ast = anterior.ast;
                    metricas.cacheHits++;
                }
            }
            try {
                if (!ast) {
                    const inicioParse = performance.now();
                    const parsed = await decifrarSintaxe(entry.content, extEfetiva);
                    if (parsed && typeof parsed === 'object') {
                        // Mantém ast undefined quando parsed é objeto vazio (forma inválida)
                        if (Object.keys(parsed).length > 0) {
                            // Sentinel convertida para o tipo NodePath via unknown cast – suficiente para diferenciar truthy
                            ast = {};
                        }
                    }
                    else if (parsed == null) {
                        // Politica: para arquivos em node_modules, não tratar falha de parsing como erro;
                        // em vez disso, seguimos com um sentinel de AST para permitir analistas que não dependem de AST completa.
                        const inNodeModules = /(^|\/)node_modules(\/|\\)/.test(entry.relPath);
                        if (inNodeModules) {
                            ast = {};
                        }
                        else {
                            const globalStore2 = globalStore;
                            const lista = globalStore2.__ORACULO_PARSE_ERROS__ || [];
                            lista.push(ocorrenciaParseErro({
                                mensagem: 'Erro de parsing: AST não gerada (código possivelmente inválido).',
                                relPath: entry.relPath,
                                origem: 'parser',
                            }));
                            globalStore2.__ORACULO_PARSE_ERROS__ = lista;
                        }
                    }
                    metricas.parsingTimeMs += performance.now() - inicioParse;
                    metricas.cacheMiss++;
                    if (config.ANALISE_AST_CACHE_ENABLED && stats) {
                        cache.set(entry.relPath, { mtimeMs: stats.mtimeMs, size: stats.size, ast });
                    }
                }
            }
            catch (e) {
                const err = e;
                log.erro(`Falha ao gerar AST para ${entry.relPath}: ${err.message}`);
                // Registra ocorrência de parse erro
                const lista = globalStore.__ORACULO_PARSE_ERROS__ || [];
                lista.push(ocorrenciaParseErro({
                    mensagem: `Erro de parsing: ${err.message}`,
                    relPath: entry.relPath,
                    origem: 'parser',
                }));
                globalStore.__ORACULO_PARSE_ERROS__ = lista;
            }
        }
        return {
            ...entry,
            ast,
            fullPath: typeof entry.fullPath === 'string'
                ? entry.fullPath
                : path.resolve(baseDir, entry.relPath),
        };
    }));
}
export async function iniciarInquisicao(baseDir = process.cwd(), options = {}) {
    const { includeContent = true, incluirMetadados = true, skipExec = false } = options;
    log.info(`${S.scan} Iniciando a Inquisição do Oráculo em: ${baseDir}`);
    const fileMap = await scanRepository(baseDir, {
        includeContent,
        onProgress: (msg) => {
            // Só exibe diretórios e erros, e em formato legível por máquina/pessoa
            try {
                const obj = JSON.parse(msg);
                if (obj.tipo === 'diretorio') {
                    // Atualiza contador e amostra em memória, sem emitir logs incrementais.
                    // A política semântica correta: não mostrar progresso parcial durante a varredura;
                    // em vez disso, exibimos apenas um resumo final após a conclusão da varredura.
                    const g = globalThis;
                    g.__ORACULO_DIR_COUNT__ = (g.__ORACULO_DIR_COUNT__ || 0) + 1;
                    // Armazena primeiros N diretórios como amostra para diagnóstico posterior
                    const SAMPLE_MAX = 5;
                    if (!g.__ORACULO_DIR_SAMPLES__)
                        g.__ORACULO_DIR_SAMPLES__ = [];
                    if (g.__ORACULO_DIR_SAMPLES__.length < SAMPLE_MAX) {
                        g.__ORACULO_DIR_SAMPLES__.push(obj.caminho);
                    }
                    // contador atualizado em g.__ORACULO_DIR_COUNT__ (não usado diretamente aqui)
                    // Em modo verbose original poderíamos mostrar mais detalhes, mas por padrão
                    // evitamos ruído progressivo. Erros continuam sendo reportados abaixo.
                }
                else if (obj.tipo === 'erro') {
                    log.erro(`Erro ao ${obj.acao} ${obj.caminho}: ${obj.mensagem}`);
                }
            }
            catch {
                // fallback para logs antigos
                if (msg && msg.includes('⚠️'))
                    log.aviso(msg);
            }
        },
    });
    let fileEntries;
    let entriesBase = Object.values(fileMap);
    // Filtra arquivos meta com helper central: tudo fora de src/ é meta por padrão
    const metaSet = new Set(entriesBase.filter((e) => isMetaPath(e.relPath)).map((e) => e.relPath));
    // Priorização (usa estado incremental anterior somente para ordenar)
    if (config.ANALISE_PRIORIZACAO_ENABLED && config.ANALISE_INCREMENTAL_STATE_PATH) {
        try {
            const inc = await lerEstado(config.ANALISE_INCREMENTAL_STATE_PATH).catch(() => null);
            if (inc && inc.arquivos) {
                const pesos = (config.ANALISE_PRIORIZACAO_PESOS || {
                    duracaoMs: 1,
                    ocorrencias: 2,
                    penalidadeReuso: 0.5,
                });
                const scored = entriesBase.map((e) => {
                    const hist = inc.arquivos[e.relPath];
                    if (!hist)
                        return { ...e, __score: 0 };
                    let dur = 0;
                    let occ = 0;
                    if (hist.analistas) {
                        for (const a of Object.values(hist.analistas)) {
                            dur += a.duracaoMs;
                            occ += a.ocorrencias;
                        }
                    }
                    else {
                        occ = hist.ocorrencias?.length || 0;
                    }
                    const reuso = hist.reaproveitadoCount || 0;
                    const score = dur * pesos.duracaoMs + occ * pesos.ocorrencias - reuso * pesos.penalidadeReuso;
                    return { ...e, __score: score };
                });
                scored.sort((a, b) => b.__score -
                    a.__score);
                // Reorganiza empurrando meta para o final
                const prioritarios = [];
                const metas = [];
                for (const s of scored)
                    (metaSet.has(s.relPath) ? metas : prioritarios).push(s);
                const reconstituido = [...prioritarios, ...metas];
                entriesBase = reconstituido;
                const somentePrioritarios = reconstituido.filter((e) => !metaSet.has(e.relPath));
                if (config.LOG_ESTRUTURADO) {
                    log.info(JSON.stringify({
                        tipo: 'priorizacao',
                        estrategia: 'historico-incremental',
                        top: somentePrioritarios.slice(0, 10).map((e) => ({
                            arq: e.relPath,
                            score: e.__score,
                        })),
                        metaEmpurrados: metas.length,
                    }));
                }
                else {
                    const exibidos = somentePrioritarios
                        .slice(0, 5)
                        .map((e) => e.relPath)
                        .join(', ') || '—';
                    log.info(`🧮 Priorização aplicada (top 5 sem meta): ${exibidos}`);
                    if (metas.length) {
                        log.info(`   (${S.info} ${metas.length} arquivos meta movidos para o final da fila)`);
                    }
                }
            }
        }
        catch (e) {
            if (config.DEV_MODE)
                log.erro(`Falha priorização: ${e.message}`);
        }
    }
    if (incluirMetadados) {
        fileEntries = await prepararComAst(entriesBase, baseDir);
    }
    else {
        fileEntries = entriesBase.map((entry) => ({
            ...entry,
            ast: undefined,
            fullPath: typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath),
        }));
    }
    // Exibe um resumo único da varredura preliminar, imediatamente antes da análise principal.
    try {
        const g = globalThis;
        const totalDirs = g.__ORACULO_DIR_COUNT__ || 0;
        // Não exibir caminhos nem moldura — apenas resumo simples em texto.
        const amostra = Array.isArray(g.__ORACULO_DIR_SAMPLES__) ? g.__ORACULO_DIR_SAMPLES__ : [];
        if (config.LOG_ESTRUTURADO) {
            log.info(JSON.stringify({
                tipo: 'varredura_preliminar',
                totalDiretorios: totalDirs,
                amostraDiretorios: amostra,
            }));
        }
        else {
            // Saída plain-text solicitada (sem moldura nem caminhos detalhados)
            // Exemplo:
            // resumos varredura preliminar:
            //
            // Diretórios escaneados: ?
            // arquivos escaneados: ?
            // Usamos log.info para que testes possam interceptar a saída
            log.info('resumos varredura preliminar:');
            log.info('');
            log.info(`Diretórios escaneados: ${totalDirs}`);
            log.info(`arquivos escaneados: ${fileEntries.length}`);
        }
    }
    catch {
        /* ignore */
    }
    // Agora fileEntries é FileEntryWithAst[]
    let totalArquivos = fileEntries.length;
    let ocorrencias = [];
    if (!skipExec) {
        const execRes = await executarExecucao(fileEntries, tecnicas, baseDir, undefined);
        totalArquivos = execRes.totalArquivos;
        ocorrencias = execRes.ocorrencias;
    }
    // Anexa ocorrências de parse se existirem
    const parseErros = globalThis
        .__ORACULO_PARSE_ERROS__ || [];
    if (parseErros.length) {
        // Armazena contagem original para métricas (usado em saída JSON)
        globalThis.__ORACULO_PARSE_ERROS_ORIGINAIS__ = parseErros.length;
        if (config.PARSE_ERRO_AGRUPAR) {
            const porArquivo = {};
            for (const pe of parseErros) {
                const k = pe.relPath || '__desconhecido__';
                (porArquivo[k] = porArquivo[k] || []).push(pe);
            }
            for (const [arq, lista] of Object.entries(porArquivo)) {
                if (lista.length <= (config.PARSE_ERRO_MAX_POR_ARQUIVO || 1)) {
                    ocorrencias.push(...lista);
                }
                else {
                    // Consolida em uma única ocorrência representativa
                    ocorrencias.push(ocorrenciaParseErro({
                        mensagem: `Erros de parsing agregados: ${lista.length} ocorrências suprimidas neste arquivo (exibe 1).`,
                        relPath: arq === '__desconhecido__' ? undefined : arq,
                        origem: 'parser',
                    }));
                }
            }
        }
        else {
            ocorrencias.push(...parseErros);
        }
    }
    if (!skipExec) {
        log.sucesso(`🔮 Inquisição concluída. Total de ocorrências: ${ocorrencias.length}`);
    }
    else if (!config.COMPACT_MODE) {
        __infoDestaque(`Varredura concluída: total de arquivos: ${fileEntries.length}`);
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
//# sourceMappingURL=inquisidor.js.map