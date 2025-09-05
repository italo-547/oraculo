/**
 * Sistema de Pool de Workers para Processamento Paralelo de Arquivos
 *
 * Permite processar múltiplos arquivos em paralelo usando Worker Threads,
 * melhorando a performance em projetos grandes com muitos arquivos.
 */
<<<<<<< HEAD
import type { FileEntryWithAst, Tecnica, Ocorrencia, ContextoExecucao, MetricaAnalista } from '@tipos/tipos.js';
export interface WorkerPoolOptions {
    /** Número máximo de workers simultâneos (padrão: número de CPUs) */
    maxWorkers?: number;
    /** Tamanho do lote de arquivos por worker (padrão: 10) */
    batchSize?: number;
    /** Timeout por analista em ms (padrão: valor do config) */
    timeoutMs?: number;
    /** Se deve usar workers (padrão: true se disponível) */
    enabled?: boolean;
}
export interface WorkerTask {
    files: FileEntryWithAst[];
    techniques: Tecnica[];
    context: ContextoExecucao;
    workerId: number;
}
export interface WorkerResult {
    workerId: number;
    occurrences: Ocorrencia[];
    metrics: MetricaAnalista[];
    processedFiles: number;
    errors: string[];
    duration: number;
=======
import type {
  FileEntryWithAst,
  Tecnica,
  Ocorrencia,
  ContextoExecucao,
  MetricaAnalista,
} from '@tipos/tipos.js';
export interface WorkerPoolOptions {
  /** Número máximo de workers simultâneos (padrão: número de CPUs) */
  maxWorkers?: number;
  /** Tamanho do lote de arquivos por worker (padrão: 10) */
  batchSize?: number;
  /** Timeout por analista em ms (padrão: valor do config) */
  timeoutMs?: number;
  /** Se deve usar workers (padrão: true se disponível) */
  enabled?: boolean;
}
export interface WorkerTask {
  files: FileEntryWithAst[];
  techniques: Tecnica[];
  context: ContextoExecucao;
  workerId: number;
}
export interface WorkerResult {
  workerId: number;
  occurrences: Ocorrencia[];
  metrics: MetricaAnalista[];
  processedFiles: number;
  errors: string[];
  duration: number;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
/**
 * Pool de workers para processamento paralelo de arquivos
 */
export declare class WorkerPool {
<<<<<<< HEAD
    private maxWorkers;
    private batchSize;
    private timeoutMs;
    private enabled;
    private activeWorkers;
    private results;
    private errors;
    constructor(options?: WorkerPoolOptions);
    /**
     * Processa arquivos usando pool de workers
     */
    processFiles(files: FileEntryWithAst[], techniques: Tecnica[], context: ContextoExecucao): Promise<{
        occurrences: Ocorrencia[];
        metrics: MetricaAnalista[];
        totalProcessed: number;
        duration: number;
    }>;
    /**
     * Cria lotes de arquivos para processamento paralelo
     */
    private createBatches;
    /**
     * Processa técnicas globais (não paralelizáveis)
     */
    private processGlobalTechniques;
    /**
     * Processa lotes de arquivos em paralelo
     */
    private processBatches;
    /**
     * Processa um lote de arquivos em um worker
     */
    private processBatch;
    /**
     * Processamento sequencial como fallback
     */
    private processSequentially;
    /**
     * Executa uma técnica com timeout
     */
    private executeTechniqueWithTimeout;
    /**
     * Retorna estatísticas do pool
     */
    getStats(): {
        maxWorkers: number;
        batchSize: number;
        enabled: boolean;
        activeWorkers: number;
        completedWorkers: number;
        totalErrors: number;
        errors: string[];
    };
}
/**
 * Função de conveniência para usar o pool de workers
 */
export declare function processarComWorkers(files: FileEntryWithAst[], techniques: Tecnica[], context: ContextoExecucao, options?: WorkerPoolOptions): Promise<{
=======
  private maxWorkers;
  private batchSize;
  private timeoutMs;
  private enabled;
  private activeWorkers;
  private results;
  private errors;
  constructor(options?: WorkerPoolOptions);
  /**
   * Processa arquivos usando pool de workers
   */
  processFiles(
    files: FileEntryWithAst[],
    techniques: Tecnica[],
    context: ContextoExecucao,
  ): Promise<{
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
    occurrences: Ocorrencia[];
    metrics: MetricaAnalista[];
    totalProcessed: number;
    duration: number;
<<<<<<< HEAD
}>;
//# sourceMappingURL=worker-pool.d.ts.map
=======
  }>;
  /**
   * Cria lotes de arquivos para processamento paralelo
   */
  private createBatches;
  /**
   * Processa técnicas globais (não paralelizáveis)
   */
  private processGlobalTechniques;
  /**
   * Processa lotes de arquivos em paralelo
   */
  private processBatches;
  /**
   * Processa um lote de arquivos em um worker
   */
  private processBatch;
  /**
   * Processamento sequencial como fallback
   */
  private processSequentially;
  /**
   * Executa uma técnica com timeout
   */
  private executeTechniqueWithTimeout;
  /**
   * Retorna estatísticas do pool
   */
  getStats(): {
    maxWorkers: number;
    batchSize: number;
    enabled: boolean;
    activeWorkers: number;
    completedWorkers: number;
    totalErrors: number;
    errors: string[];
  };
}
/**
 * Função de conveniência para usar o pool de workers
 */
export declare function processarComWorkers(
  files: FileEntryWithAst[],
  techniques: Tecnica[],
  context: ContextoExecucao,
  options?: WorkerPoolOptions,
): Promise<{
  occurrences: Ocorrencia[];
  metrics: MetricaAnalista[];
  totalProcessed: number;
  duration: number;
}>;
//# sourceMappingURL=worker-pool.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
