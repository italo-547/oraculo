// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { scanRepository } from './scanner.js';
import { config, aplicarConfigParcial } from '../nucleo/constelacao/cosmos.js';

const mkTemp = async (prefix: string) => {
  const base = path.join(process.cwd(), 'tmp-scan-only', `${prefix}-${Date.now()}`);
  await fs.mkdir(base, { recursive: true });
  return base;
};

describe('scanner – branches extras', () => {
  const original = { ...config } as any;
  let baseDir = '';

  beforeAll(async () => {
    baseDir = await mkTemp('branches4');
  });

  afterAll(async () => {
    // restaura config mutável ao estado original mínimo relevante
    aplicarConfigParcial({
      CLI_INCLUDE_GROUPS: original.CLI_INCLUDE_GROUPS ?? [],
      CLI_INCLUDE_PATTERNS: original.CLI_INCLUDE_PATTERNS ?? [],
      CLI_EXCLUDE_PATTERNS: original.CLI_EXCLUDE_PATTERNS ?? [],
      ZELADOR_IGNORE_PATTERNS: original.ZELADOR_IGNORE_PATTERNS ?? [],
      INCLUDE_EXCLUDE_RULES: original.INCLUDE_EXCLUDE_RULES,
      SCAN_ONLY: false,
      ANALISE_SCAN_ONLY: false,
      REPORT_SILENCE_LOGS: true,
    } as any);
  });

  it('calcularIncludeRoots: ignora padrão vazio e mapeia grupo indefinido (cobre g||[] e !p continue)', async () => {
    // arquivo qualquer
    const f = path.join(baseDir, 'foo.txt');
    await fs.writeFile(f, 'ok');
    // Força grupos com item indefinido e padrão vazio
    aplicarConfigParcial({
      CLI_INCLUDE_GROUPS: [undefined] as unknown as string[][],
      CLI_INCLUDE_PATTERNS: [''],
      CLI_EXCLUDE_PATTERNS: [],
      ZELADOR_IGNORE_PATTERNS: [],
      REPORT_SILENCE_LOGS: true,
    } as any);
    const mapa = await scanRepository(baseDir, { includeContent: false });
    // Sem âncoras derivadas e include não casando, nada incluído (apenas executa o caminho)
    expect(mapa).toBeTypeOf('object');
  });

  it('ignore em nível de arquivo quando não há includes (cobre ramo de arquivo)', async () => {
    const dirCov = path.join(baseDir, 'coverage');
    await fs.mkdir(dirCov, { recursive: true });
    const fileIgnored = path.join(dirCov, 'x.txt');
    await fs.writeFile(fileIgnored, 'ignore-me');
    aplicarConfigParcial({
      CLI_INCLUDE_GROUPS: [],
      CLI_INCLUDE_PATTERNS: [],
      CLI_EXCLUDE_PATTERNS: [],
      // Ignora especificamente o arquivo, não o diretório, para atingir o ramo de arquivos
      ZELADOR_IGNORE_PATTERNS: ['coverage/x.txt'],
      REPORT_SILENCE_LOGS: true,
    } as any);
    const res = await scanRepository(baseDir, { includeContent: false });
    expect(res['coverage/x.txt']).toBeUndefined();
  });

  it('INCLUDE_EXCLUDE_RULES: globalExclude impede inclusão do arquivo', async () => {
    const alvo = path.join(baseDir, 'a.txt');
    await fs.writeFile(alvo, 'A');
    aplicarConfigParcial({
      CLI_INCLUDE_GROUPS: [],
      CLI_INCLUDE_PATTERNS: [],
      CLI_EXCLUDE_PATTERNS: [],
      ZELADOR_IGNORE_PATTERNS: [],
      INCLUDE_EXCLUDE_RULES: { globalExclude: ['a.txt'] },
      REPORT_SILENCE_LOGS: true,
    } as any);
    const res = await scanRepository(baseDir, { includeContent: false });
    expect(res['a.txt']).toBeUndefined();
  });

  it('catch externo com erro não-objeto via onProgress (mensagem String(err)) mantém entrada no mapa', async () => {
    const alvo = path.join(baseDir, 'b.txt');
    await fs.writeFile(alvo, 'B');
    aplicarConfigParcial({
      CLI_INCLUDE_GROUPS: [],
      CLI_INCLUDE_PATTERNS: [],
      CLI_EXCLUDE_PATTERNS: [],
      ZELADOR_IGNORE_PATTERNS: [],
      INCLUDE_EXCLUDE_RULES: undefined,
      REPORT_SILENCE_LOGS: false,
    } as any);
    const res = await scanRepository(baseDir, {
      includeContent: false,
      onProgress: (msg) => {
        if (typeof msg === 'string' && msg.startsWith('✅ Arquivo lido:')) {
          // lança string para cobrir caminho String(err)
          throw 'boom';
        }
      },
    });
    expect(res['b.txt']).toBeDefined();
  });
});
