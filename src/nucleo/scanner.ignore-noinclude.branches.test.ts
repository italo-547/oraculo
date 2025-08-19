// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

// Este teste cobre o ramo: "!hasInclude && micromatch.isMatch(relPath, ignorePatternsNorm)" para diretórios e arquivos
// Cria uma estrutura com node_modules/ e .git/ e valida que são ignorados quando não há include

describe('scanner — ignores padrão quando não há include (branches)', () => {
  const tmpBase = path.join(os.tmpdir(), `oraculo-scan-ignore-${Date.now()}`);
  const nmDir = path.join(tmpBase, 'node_modules');
  const gitDir = path.join(tmpBase, '.git');
  const nmFile = path.join(nmDir, 'pkg.js');
  const gitFile = path.join(gitDir, 'HEAD');

  let originalIgnore: string[] | undefined;
  let originalReportSilence: boolean | undefined;

  beforeAll(async () => {
    await fs.mkdir(nmDir, { recursive: true });
    await fs.mkdir(gitDir, { recursive: true });
    await fs.writeFile(nmFile, 'x', 'utf-8');
    await fs.writeFile(gitFile, 'ref: main', 'utf-8');

    const { config } = await import('../nucleo/constelacao/cosmos');
    originalReportSilence = config.REPORT_SILENCE_LOGS;
    originalIgnore = Array.isArray(config.ZELADOR_IGNORE_PATTERNS)
      ? [...config.ZELADOR_IGNORE_PATTERNS]
      : undefined;
    // Define ignores típicos
    config.ZELADOR_IGNORE_PATTERNS = ['node_modules/**', '.git/**'];
    config.REPORT_SILENCE_LOGS = true;
  });

  afterAll(async () => {
    const { config } = await import('../nucleo/constelacao/cosmos');
    if (typeof originalReportSilence !== 'undefined')
      config.REPORT_SILENCE_LOGS = originalReportSilence;
    if (originalIgnore) config.ZELADOR_IGNORE_PATTERNS = originalIgnore;
    await fs.rm(tmpBase, { recursive: true, force: true });
  });

  it('ignora node_modules e .git sem includes ativos', async () => {
    const { scanRepository } = await import('./scanner');
    const mapa = await scanRepository(tmpBase, { includeContent: false });

    // Nada deve ter sido mapeado
    expect(Object.keys(mapa).length).toBe(0);
  });
});
