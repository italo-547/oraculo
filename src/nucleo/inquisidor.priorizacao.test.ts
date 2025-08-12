import { describe, it, expect, vi } from 'vitest';
import { iniciarInquisicao } from './inquisidor.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config, aplicarConfigParcial } from './constelacao/cosmos.js';

vi.mock('./constelacao/log.js', () => ({
  log: { info: vi.fn(), sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() },
}));

// Mock scanRepository para controlar ordem base
vi.mock('./scanner.js', () => ({
  scanRepository: vi.fn().mockResolvedValue({
    'a.js': { fullPath: 'a.js', relPath: 'a.js', content: 'const a=1' },
    'b.js': { fullPath: 'b.js', relPath: 'b.js', content: 'const b=2' },
    'c.js': { fullPath: 'c.js', relPath: 'c.js', content: 'const c=3' },
  }),
}));

// Mock registroAnalistas vazio para acelerar
vi.mock('../analistas/registry.js', () => ({ registroAnalistas: [] }));

// Mock parser para não gerar AST real
vi.mock('./parser.js', () => ({
  decifrarSintaxe: vi.fn().mockResolvedValue({ node: {}, parent: null }),
}));

// Mock executarExecucao para não depender de analistas
vi.mock('./executor.js', () => ({
  executarInquisicao: vi.fn().mockResolvedValue({ totalArquivos: 3, ocorrencias: [] }),
}));

import { executarInquisicao as executarExecucao } from './executor.js';

describe('priorizacao inquisidor', () => {
  it('ordena arquivos usando histórico incremental', async () => {
    // Cria estado incremental com métricas diferentes
    const tmpDir = path.join(process.cwd(), '.oraculo');
    await fs.mkdir(tmpDir, { recursive: true });
    const incPath = config.ANALISE_INCREMENTAL_STATE_PATH;
    const estado = {
      versao: 1,
      arquivos: {
        'a.js': {
          hash: '1',
          ocorrencias: [{ tipo: 'X', mensagem: 'x' }],
          analistas: { an: { ocorrencias: 3, duracaoMs: 30 } },
          reaproveitadoCount: 0,
        },
        'b.js': {
          hash: '2',
          ocorrencias: [{ tipo: 'X', mensagem: 'x' }],
          analistas: { an: { ocorrencias: 1, duracaoMs: 5 } },
          reaproveitadoCount: 5,
        },
        'c.js': {
          hash: '3',
          ocorrencias: [],
          analistas: { an: { ocorrencias: 0, duracaoMs: 1 } },
          reaproveitadoCount: 0,
        },
      },
    };
    await fs.writeFile(incPath, JSON.stringify(estado), 'utf-8');
    aplicarConfigParcial({ ANALISE_PRIORIZACAO_ENABLED: true });

    await iniciarInquisicao(process.cwd(), { includeContent: true });
    // Verifica que executor recebeu fileEntries já ordenados (mock não sabe ordem, então inspecionamos chamada)
    expect(executarExecucao).toHaveBeenCalled();
    const chamada = (executarExecucao as any).mock.calls[0][0];
    // Score esperado: a.js (dur 30 occ 3) > b.js penalizado (5 reusos) ~ (dur5 occ1 - reuso*0.5*5) < c.js
    // Portanto a.js primeiro; c.js pode vir antes de b.js.
    expect(chamada[0].relPath).toBe('a.js');
  });
});
