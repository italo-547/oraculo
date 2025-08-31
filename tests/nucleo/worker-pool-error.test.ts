import { describe, it, expect, vi } from 'vitest';

vi.mock('node:worker_threads', () => {
  class MockWorkerErr {
    _opts: any;
    constructor(path: string, opts: any) {
      this._opts = opts;
    }
    on(event: string, cb: Function) {
      if (event === 'message') {
        // never sends message
      }
      if (event === 'error') {
        // emit error async
        setImmediate(() => cb(new Error('Simulated worker error')));
      }
      if (event === 'exit') {
        setImmediate(() => cb(1));
      }
    }
    terminate() {
      return Promise.resolve(0);
    }
  }
  return { Worker: MockWorkerErr } as any;
});

import { processarComWorkers } from '../../../src/nucleo/worker-pool.js';

describe('WorkerPool (mocked) - error', () => {
  it('captura erro do worker e registra ocorrencia', async () => {
    const files = [{ relPath: 'a.js', content: 'x', ast: undefined, fullPath: 'a.js' }];
    const res = await processarComWorkers(
      files as any,
      [],
      { baseDir: process.cwd(), arquivos: files } as any,
      { batchSize: 1, maxWorkers: 1 } as any,
    );
    expect(res).toBeDefined();
    // resultado deve conter uma ocorrência de erro quando worker falha
    const hasError = Array.isArray(res.occurrences) && res.occurrences.length > 0;
    expect(hasError).toBe(true);
  });
});
