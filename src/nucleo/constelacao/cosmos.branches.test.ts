import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

describe('cosmos deepMerge e overrides', () => {
  const ENV_KEY = 'ORACULO_ANALISE_LIMITES_FUNCOES_LONGAS_MAX_LINHAS';
  beforeEach(() => {
    vi.resetModules();
    delete process.env[ENV_KEY];
  });

  it('prioridade: arquivo < env < cli', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-cos-'));
    await fs.writeFile(
      path.join(dir, 'oraculo.config.json'),
      JSON.stringify({ ANALISE_LIMITES: { FUNCOES_LONGAS: { MAX_LINHAS: 10 } } }),
      'utf-8',
    );
    process.env[ENV_KEY] = '15';
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
    const { inicializarConfigDinamica, config } = await import('./cosmos.js');
    const diffs = await inicializarConfigDinamica({
      ANALISE_LIMITES: { FUNCOES_LONGAS: { MAX_LINHAS: 20 } },
    });
    expect(config.ANALISE_LIMITES.FUNCOES_LONGAS.MAX_LINHAS).toBe(20);
    expect(Object.keys(diffs)).toContain('ANALISE_LIMITES.FUNCOES_LONGAS.MAX_LINHAS');
    const { aplicarConfigParcial } = await import('./cosmos.js');
    aplicarConfigParcial({ ANALISE_PRIORIZACAO_PESOS: { duracaoMs: 5 } });
    expect(config.ANALISE_PRIORIZACAO_PESOS.duracaoMs).toBe(5);
    cwdSpy.mockRestore();
  });

  it('carrega env boolean e number corretamente', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-cos-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
    process.env.ORACULO_GUARDIAN_ENABLED = 'false';
    process.env.ORACULO_ANALISE_METRICAS_HISTORICO_MAX = '123';
    const { inicializarConfigDinamica, config } = await import('./cosmos.js');
    await inicializarConfigDinamica();
    expect(config.GUARDIAN_ENABLED).toBe(false);
    expect(config.ANALISE_METRICAS_HISTORICO_MAX).toBe(123);
    cwdSpy.mockRestore();
    delete process.env.ORACULO_GUARDIAN_ENABLED;
    delete process.env.ORACULO_ANALISE_METRICAS_HISTORICO_MAX;
  });
});
