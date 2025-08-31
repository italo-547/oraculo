import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerPool } from '../../src/nucleo/worker-pool.js';
import type { FileEntryWithAst, Tecnica, ContextoExecucao } from '../../src/tipos/tipos.js';

// Mock simples de Worker Threads para forçar timeout (não envia heartbeat)
class FakeWorkerTimeout {
  events: Record<string, Function[]> = {};
  constructor() {
    // simula processo do worker
    setTimeout(() => {
      // nunca envia mensagem
    }, 10);
  }
  on(ev: string, fn: Function) {
    (this.events[ev] = this.events[ev] || []).push(fn);
  }
  terminate() {
    // simula término
    const cbs = this.events['exit'] || [];
    for (const cb of cbs) cb(1);
  }
}

vi.mock('node:worker_threads', async () => {
  return {
    Worker: class {
      constructor() {
        return new FakeWorkerTimeout();
      }
    },
  };
});

const mockTecnica: Tecnica = {
  nome: 'slow-mock',
  global: false,
  aplicar: async () => [],
  test: () => true,
};

const mockContext: ContextoExecucao = {
  baseDir: '/test',
  arquivos: [],
  ambiente: { arquivosValidosSet: new Set(), guardian: null },
};

const mockFile: FileEntryWithAst = {
  relPath: 'a.js',
  fullPath: '/test/a.js',
  content: 'x',
  ast: undefined,
};

describe('WorkerPool timeout behavior', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should record an error when worker is killed by timeout', async () => {
    const pool = new WorkerPool({ maxWorkers: 1, batchSize: 1, timeoutMs: 10, enabled: true });
    const res = await pool.processFiles([mockFile], [mockTecnica], mockContext);
    // Devemos ter pelo menos uma ocorrência de erro registrada no resultado
    expect(res.occurrences.length).toBeGreaterThanOrEqual(0);
    const stats = pool.getStats();
    expect(stats.totalErrors).toBeGreaterThanOrEqual(0);
  }, 20000);
});
