import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerPool } from '../../src/nucleo/worker-pool.js';
import type { FileEntryWithAst, Tecnica, ContextoExecucao } from '../../src/tipos/tipos.js';

// Mock que envia heartbeat e depois posta mensagem de sucesso
class FakeWorkerHeartbeat {
  events: Record<string, Function[]> = {};
  constructor() {
    // envia heartbeat algumas vezes e depois mensagem de sucesso
    setTimeout(() => {
      const m = { type: 'heartbeat', ts: Date.now(), workerId: 1 };
      (this.events['message'] || []).forEach((cb) => cb(m));
    }, 10);
    setTimeout(() => {
      const res = {
        workerId: 1,
        occurrences: [],
        metrics: [],
        processedFiles: 1,
        errors: [],
        duration: 5,
      };
      (this.events['message'] || []).forEach((cb) => cb(res));
    }, 20);
  }
  on(ev: string, fn: Function) {
    (this.events[ev] = this.events[ev] || []).push(fn);
  }
  terminate() {
    const cbs = this.events['exit'] || [];
    for (const cb of cbs) cb(0);
  }
}

vi.mock('node:worker_threads', async () => {
  return {
    Worker: class {
      constructor() {
        return new FakeWorkerHeartbeat();
      }
    },
  };
});

const mockTecnica: Tecnica = {
  nome: 'fast-mock',
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

describe('WorkerPool heartbeat behavior', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should accept results when heartbeat present', async () => {
    const pool = new WorkerPool({ maxWorkers: 1, batchSize: 1, timeoutMs: 1000, enabled: true });
    const res = await pool.processFiles([mockFile], [mockTecnica], mockContext);
    expect(res.totalProcessed).toBe(1);
    const stats = pool.getStats();
    expect(stats.totalErrors).toBe(0);
  }, 20000);
});
