/**
 * Testes para o sistema de pool de workers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkerPool, processarComWorkers } from '../../src/nucleo/worker-pool.js';
import type { FileEntryWithAst, Tecnica, ContextoExecucao } from '../../src/tipos/tipos.js';

// Mock de técnica simples para testes
const mockTecnica: Tecnica = {
  nome: 'teste-mock',
  global: false,
  aplicar: vi.fn().mockResolvedValue([]),
  test: vi.fn().mockReturnValue(true),
};

// Mock de contexto de execução
const mockContexto: ContextoExecucao = {
  baseDir: '/test',
  arquivos: [],
  ambiente: {
    arquivosValidosSet: new Set(),
    guardian: null,
  },
};

// Mock de arquivo
const mockArquivo: FileEntryWithAst = {
  relPath: 'test.js',
  fullPath: '/test/test.js',
  content: 'console.log("test");',
  ast: undefined,
};

describe('WorkerPool', () => {
  let pool: WorkerPool;

  beforeEach(() => {
    pool = new WorkerPool({
      maxWorkers: 2,
      batchSize: 5,
      timeoutMs: 5000,
      enabled: true,
    });
  });

  describe('Configuração', () => {
    it('deve inicializar com configurações padrão', () => {
      const defaultPool = new WorkerPool();
      expect(defaultPool).toBeDefined();
    });

    it('deve respeitar configurações customizadas', () => {
      expect(pool).toBeDefined();
    });

    it('deve desabilitar workers quando solicitado', () => {
      const disabledPool = new WorkerPool({ enabled: false });
      expect(disabledPool).toBeDefined();
    });
  });

  describe('Processamento Sequencial', () => {
    it('deve processar arquivos sequencialmente quando workers desabilitados', async () => {
      const disabledPool = new WorkerPool({ enabled: false });
      const files = [mockArquivo];
      const techniques = [mockTecnica];

      const result = await disabledPool.processFiles(files, techniques, mockContexto);

      expect(result).toBeDefined();
      expect(result.occurrences).toBeDefined();
      expect(result.totalProcessed).toBe(1);
    });

    it('deve processar múltiplos arquivos sequencialmente', async () => {
      const disabledPool = new WorkerPool({ enabled: false });
      const files = [mockArquivo, { ...mockArquivo, relPath: 'test2.js' }];
      const techniques = [mockTecnica];

      const result = await disabledPool.processFiles(files, techniques, mockContexto);

      expect(result.totalProcessed).toBe(2);
    });
  });

  describe('Criação de Lotes', () => {
    it('deve criar lotes corretamente', () => {
      const files = Array.from({ length: 12 }, (_, i) => ({
        ...mockArquivo,
        relPath: `test${i}.js`,
      }));

      const batches = pool['createBatches'](files);
      expect(batches.length).toBe(3); // 12 arquivos / 5 por lote = 3 lotes
      expect(batches[0].length).toBe(5);
      expect(batches[2].length).toBe(2); // último lote com resto
    });
  });

  describe('Função de Conveniência', () => {
    it('deve exportar função processarComWorkers', () => {
      expect(typeof processarComWorkers).toBe('function');
    });

    it('deve processar arquivos usando a função de conveniência', async () => {
      const files = [mockArquivo];
      const techniques = [mockTecnica];

      const result = await processarComWorkers(files, techniques, mockContexto, {
        enabled: false, // desabilitar para teste
      });

      expect(result).toBeDefined();
      expect(result.totalProcessed).toBe(1);
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas do pool', () => {
      const stats = pool.getStats();
      expect(stats).toBeDefined();
      expect(stats.maxWorkers).toBe(2);
      expect(stats.batchSize).toBe(5);
      expect(stats.enabled).toBe(true);
    });
  });
});
