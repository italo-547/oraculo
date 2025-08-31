import { describe, it, expect, vi } from 'vitest';

// Mock do Worker threads antes de importar WorkerPool
vi.mock('node:worker_threads', () => {
  class MockWorker {
    _opts: any;
    _onmsg: Function | null = null;
    _onerr: Function | null = null;
    _onexit: Function | null = null;
    constructor(path: string, opts: any) {
      this._opts = opts;
    }
    on(event: string, cb: Function) {
      if (event === 'message') {
        this._onmsg = cb;
        // garante resposta assíncrona após handler anexado
        setImmediate(() => {
          if (this._onmsg)
            this._onmsg({
              occurrences: [],
              metrics: [],
              processedFiles: (this._opts?.workerData?.files || []).length,
              workerId: this._opts?.workerData?.workerId ?? 0,
              duration: 1,
            });
        });
      }
      if (event === 'error') this._onerr = cb;
      if (event === 'exit') this._onexit = cb;
    }
    terminate() {
      return Promise.resolve(0);
    }
  }
  return { Worker: MockWorker } as any;
});

import { processarComWorkers } from '../../../src/nucleo/worker-pool.js';

describe('WorkerPool (mocked) - success', () => {
  it('processa lotes com sucesso', async () => {
    const files = [{ relPath: 'a.js', content: 'x', ast: undefined, fullPath: 'a.js' }];
    const res = await processarComWorkers(
      files as any,
      [],
      { baseDir: process.cwd(), arquivos: files } as any,
      { batchSize: 1, maxWorkers: 1 } as any,
    );
    expect(res).toBeDefined();
    expect(res.totalProcessed).toBe(files.length);
  });
});
