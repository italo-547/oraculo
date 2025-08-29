import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarInquisicao } from '../src/nucleo/executor.js';
import { Tecnica } from '../src/tipos/tipos.js';
import { config } from '../src/nucleo/constelacao/cosmos.js';

// Mock de um analista que demora mais que o timeout
const analistaLento: Tecnica = {
  nome: 'analista-lento-test',
  global: false,
  aplicar: async () => {
    // Simula um delay maior que o timeout (3s > 2s configurado)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return [
      {
        tipo: 'TESTE_TIMEOUT',
        mensagem: 'Esta ocorrência não deveria aparecer',
        relPath: 'teste.ts',
        linha: 1,
        coluna: 1,
        nivel: 'info',
      },
    ];
  },
};

describe('Timeout por Analista', () => {
  beforeEach(() => {
    // Configura timeout de 2 segundos para testes (mais rápido)
    config.ANALISE_TIMEOUT_POR_ANALISTA_MS = 2000;
    config.ANALISE_METRICAS_ENABLED = false;
  });

  it('deve cancelar analista que excede timeout', async () => {
    const fileEntries = [
      {
        relPath: 'teste.ts',
        content: 'console.log("teste");',
        fullPath: '/path/to/teste.ts',
        ast: null,
      },
    ];

    const tecnicas = [analistaLento];
    const baseDir = '/test';
    const guardianResultado = null;

    // Mede o tempo de execução
    const inicio = Date.now();
    const resultado = await executarInquisicao(fileEntries, tecnicas, baseDir, guardianResultado);
    const duracao = Date.now() - inicio;

    // Deve completar em menos de 3 segundos (timeout + margem)
    expect(duracao).toBeLessThan(3000);

    // Deve ter uma ocorrência de timeout
    const timeoutOcorrencias = resultado.ocorrencias.filter(
      (o) => o.mensagem.includes('Timeout na técnica') && o.mensagem.includes('2000ms excedido'),
    );

    expect(timeoutOcorrencias).toHaveLength(1);
    expect(timeoutOcorrencias[0].origem).toBe('analista-lento-test');
    expect(timeoutOcorrencias[0].relPath).toBe('teste.ts');
  }, 10000); // 10 segundos de timeout para o teste

  it('deve funcionar normalmente quando timeout é 0 (desabilitado)', async () => {
    // Desabilita timeout
    config.ANALISE_TIMEOUT_POR_ANALISTA_MS = 0;

    const analistaRapido: Tecnica = {
      nome: 'analista-rapido-test',
      global: false,
      aplicar: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms
        return [
          {
            tipo: 'TESTE_NORMAL',
            mensagem: 'Execução normal concluída',
            relPath: 'teste.ts',
            linha: 1,
            coluna: 1,
            nivel: 'info',
          },
        ];
      },
    };

    const fileEntries = [
      {
        relPath: 'teste.ts',
        content: 'console.log("teste");',
        fullPath: '/path/to/teste.ts',
        ast: null,
      },
    ];

    const tecnicas = [analistaRapido];
    const baseDir = '/test';
    const guardianResultado = null;

    const resultado = await executarInquisicao(fileEntries, tecnicas, baseDir, guardianResultado);

    // Deve ter a ocorrência normal, não de timeout
    const normalOcorrencias = resultado.ocorrencias.filter((o) => o.tipo === 'TESTE_NORMAL');

    expect(normalOcorrencias).toHaveLength(1);
    expect(normalOcorrencias[0].mensagem).toBe('Execução normal concluída');
  });
});
