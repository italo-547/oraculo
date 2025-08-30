// SPDX-License-Identifier: MIT
/**
 * Sistema de Pool de Workers para Processamento Paralelo de Arquivos
 *
 * Permite processar múltiplos arquivos em paralelo usando Worker Threads,
 * melhorando a performance em projetos grandes com muitos arquivos.
 */
import { Worker } from 'node:worker_threads';
import * as path from 'node:path';
import * as os from 'node:os';
import { ocorrenciaErroAnalista } from '../tipos/tipos.js';
import { config } from './constelacao/cosmos.js';
import { log } from './constelacao/log.js';
/**
 * Pool de workers para processamento paralelo de arquivos
 */
export class WorkerPool {
    maxWorkers;
    batchSize;
    timeoutMs;
    enabled;
    activeWorkers = 0;
    results = [];
    errors = [];
    constructor(options = {}) {
        this.maxWorkers = options.maxWorkers ?? Math.min(os.cpus().length, 8);
        this.batchSize = options.batchSize ?? 10;
        this.timeoutMs = options.timeoutMs ?? config.ANALISE_TIMEOUT_POR_ANALISTA_MS;
        this.enabled = options.enabled ?? config.WORKER_POOL_ENABLED !== false;
        // Verifica se Worker Threads estão disponíveis
        if (!this.enabled || !Worker) {
            this.enabled = false;
            log.info('Pool de workers desabilitado (Worker Threads não disponível)');
        }
    }
    /**
     * Processa arquivos usando pool de workers
     */
    async processFiles(files, techniques, context) {
        if (!this.enabled || files.length < this.batchSize) {
            // Fallback para processamento sequencial
            return this.processSequentially(files, techniques, context);
        }
        const startTime = performance.now();
        const batches = this.createBatches(files);
        const nonGlobalTechniques = techniques.filter((t) => !t.global);
        log.info(`🚀 Iniciando processamento paralelo com ${this.maxWorkers} workers`);
        log.info(`📦 ${batches.length} lotes de até ${this.batchSize} arquivos cada`);
        // Processa lotes globais primeiro
        const globalTechniques = techniques.filter((t) => t.global);
        if (globalTechniques.length > 0) {
            await this.processGlobalTechniques(globalTechniques, context);
        }
        // Processa lotes de arquivos em paralelo
        await this.processBatches(batches, nonGlobalTechniques, context);
        const duration = performance.now() - startTime;
        const totalOccurrences = this.results.reduce((sum, r) => sum + r.occurrences.length, 0);
        const totalMetrics = this.results.flatMap((r) => r.metrics);
        log.info(`✅ Processamento paralelo concluído em ${Math.round(duration)}ms`);
        log.info(`📊 ${this.results.length} workers, ${files.length} arquivos, ${totalOccurrences} ocorrências`);
        return {
            occurrences: this.results.flatMap((r) => r.occurrences),
            metrics: totalMetrics,
            totalProcessed: files.length,
            duration,
        };
    }
    /**
     * Cria lotes de arquivos para processamento paralelo
     */
    createBatches(files) {
        const batches = [];
        for (let i = 0; i < files.length; i += this.batchSize) {
            batches.push(files.slice(i, i + this.batchSize));
        }
        return batches;
    }
    /**
     * Processa técnicas globais (não paralelizáveis)
     */
    async processGlobalTechniques(techniques, context) {
        for (const technique of techniques) {
            try {
                const startTime = performance.now();
                const result = await this.executeTechniqueWithTimeout(technique, '', // conteúdo vazio para técnicas globais
                '[global]', null, // sem AST
                undefined, // sem fullPath
                context);
                if (result) {
                    const occurrences = Array.isArray(result) ? result : [result];
                    this.results.push({
                        workerId: -1, // ID especial para global
                        occurrences,
                        metrics: [
                            {
                                nome: technique.nome || 'global',
                                duracaoMs: performance.now() - startTime,
                                ocorrencias: occurrences.length,
                                global: true,
                            },
                        ],
                        processedFiles: 0,
                        errors: [],
                        duration: performance.now() - startTime,
                    });
                }
            }
            catch (error) {
                const err = error;
                this.errors.push(`Erro em técnica global '${technique.nome}': ${err.message}`);
                this.results.push({
                    workerId: -1,
                    occurrences: [
                        ocorrenciaErroAnalista({
                            mensagem: `Falha na técnica global '${technique.nome}': ${err.message}`,
                            relPath: '[execução global]',
                            origem: technique.nome,
                        }),
                    ],
                    metrics: [],
                    processedFiles: 0,
                    errors: [err.message],
                    duration: 0,
                });
            }
        }
    }
    /**
     * Processa lotes de arquivos em paralelo
     */
    async processBatches(batches, techniques, context) {
        const promises = [];
        for (let i = 0; i < batches.length; i++) {
            if (this.activeWorkers >= this.maxWorkers) {
                // Aguarda um worker terminar antes de iniciar outro
                await Promise.race(promises);
            }
            const promise = this.processBatch(batches[i], techniques, context, i);
            promises.push(promise);
            // Remove promises concluídas
            promises.filter((p) => p !== promise);
        }
        // Aguarda todos os workers terminarem
        await Promise.all(promises);
    }
    /**
     * Processa um lote de arquivos em um worker
     */
    async processBatch(files, techniques, context, batchId) {
        this.activeWorkers++;
        try {
            const workerPath = path.join(__dirname, 'worker-executor.js');
            const worker = new Worker(workerPath, {
                workerData: {
                    files,
                    techniques,
                    context,
                    workerId: batchId,
                    timeoutMs: this.timeoutMs,
                },
            });
            const result = await new Promise((resolve, reject) => {
                worker.on('message', resolve);
                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Worker ${batchId} exited with code ${code}`));
                    }
                });
            });
            this.results.push(result);
        }
        catch (error) {
            const err = error;
            this.errors.push(`Erro no worker ${batchId}: ${err.message}`);
            // Adiciona resultado de erro
            this.results.push({
                workerId: batchId,
                occurrences: [
                    ocorrenciaErroAnalista({
                        mensagem: `Falha no worker ${batchId}: ${err.message}`,
                        relPath: `[worker-${batchId}]`,
                        origem: 'worker-pool',
                    }),
                ],
                metrics: [],
                processedFiles: 0,
                errors: [err.message],
                duration: 0,
            });
        }
        finally {
            this.activeWorkers--;
        }
    }
    /**
     * Processamento sequencial como fallback
     */
    async processSequentially(files, techniques, context) {
        const startTime = performance.now();
        const occurrences = [];
        const metrics = [];
        log.info('🔄 Usando processamento sequencial (workers desabilitados)');
        // Processa técnicas globais
        const globalTechniques = techniques.filter((t) => t.global);
        for (const technique of globalTechniques) {
            try {
                const result = await this.executeTechniqueWithTimeout(technique, '', '[global]', null, undefined, context);
                if (result) {
                    const occs = Array.isArray(result) ? result : [result];
                    occurrences.push(...occs);
                }
            }
            catch (error) {
                const err = error;
                occurrences.push(ocorrenciaErroAnalista({
                    mensagem: `Falha na técnica global '${technique.nome}': ${err.message}`,
                    relPath: '[execução global]',
                    origem: technique.nome,
                }));
            }
        }
        // Processa arquivos sequencialmente
        const nonGlobalTechniques = techniques.filter((t) => !t.global);
        for (const file of files) {
            for (const technique of nonGlobalTechniques) {
                if (technique.test && !technique.test(file.relPath))
                    continue;
                try {
                    const startTime = performance.now();
                    const result = await this.executeTechniqueWithTimeout(technique, file.content ?? '', file.relPath, file.ast ?? null, file.fullPath, context);
                    if (result) {
                        const occs = Array.isArray(result) ? result : [result];
                        occurrences.push(...occs);
                    }
                    const duration = performance.now() - startTime;
                    metrics.push({
                        nome: technique.nome || 'desconhecido',
                        duracaoMs: duration,
                        ocorrencias: Array.isArray(result) ? result.length : result ? 1 : 0,
                        global: false,
                    });
                }
                catch (error) {
                    const err = error;
                    occurrences.push(ocorrenciaErroAnalista({
                        mensagem: `Falha na técnica '${technique.nome}' para ${file.relPath}: ${err.message}`,
                        relPath: file.relPath,
                        origem: technique.nome,
                    }));
                }
            }
        }
        return {
            occurrences,
            metrics,
            totalProcessed: files.length,
            duration: performance.now() - startTime,
        };
    }
    /**
     * Executa uma técnica com timeout
     */
    async executeTechniqueWithTimeout(technique, content, relPath, ast, fullPath, context) {
        if (this.timeoutMs > 0) {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Timeout: analista '${technique.nome}' excedeu ${this.timeoutMs}ms`));
                }, this.timeoutMs);
            });
            const execPromise = technique.aplicar(content, relPath, ast, fullPath, context);
            return await Promise.race([execPromise, timeoutPromise]);
        }
        else {
            return await technique.aplicar(content, relPath, ast, fullPath, context);
        }
    }
    /**
     * Retorna estatísticas do pool
     */
    getStats() {
        return {
            maxWorkers: this.maxWorkers,
            batchSize: this.batchSize,
            enabled: this.enabled,
            activeWorkers: this.activeWorkers,
            completedWorkers: this.results.length,
            totalErrors: this.errors.length,
            errors: this.errors,
        };
    }
}
/**
 * Função de conveniência para usar o pool de workers
 */
export async function processarComWorkers(files, techniques, context, options) {
    const pool = new WorkerPool(options);
    return await pool.processFiles(files, techniques, context);
}
//# sourceMappingURL=worker-pool.js.map