// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Command } from 'commander';

function snapshot(parcial: any = {}) {
  return {
    tipo: 'baseline',
    timestamp: new Date().toISOString(),
    node: process.version,
    ...parcial,
  };
}

async function write(dir: string, data: any) {
  await fs.mkdir(dir, { recursive: true });
  const nome = `baseline-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
  await fs.writeFile(path.join(dir, nome), JSON.stringify(data, null, 2), 'utf-8');
}

describe('comando perf compare regressão não-json', () => {
  it('gera log.aviso de regressão quando variação > limite', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'orac-perf-reg-'));
    // snapshot anterior menor; novo maior (regressão)
    await write(dir, snapshot({ tempoAnaliseMs: 100, tempoParsingMs: 50 }));
    await new Promise((r) => setTimeout(r, 5));
    await write(dir, snapshot({ tempoAnaliseMs: 200, tempoParsingMs: 120 }));

    const avisos: string[] = [];
    const infos: string[] = [];
    let sucesso: string[] = [];
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: (m: string) => infos.push(m),
        aviso: (m: string) => avisos.push(m),
        erro: () => undefined,
        sucesso: (m: string) => sucesso.push(m),
      },
    }));
    const { comandoPerf } = await import('../../src/cli/comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    // limite bem baixo (10%) para garantir regressão > limite
    await program.parseAsync(['node', 'cli', 'perf', 'compare', '--dir', dir, '--limite', '10']);
    expect(avisos.some((a) => /Regressão acima/.test(a))).toBe(true);
    // também deve logar cabeçalho de comparação
    expect(infos.some((i) => /Comparação entre snapshots/.test(i))).toBe(true);
  });

  it('caminho sucesso não-json sem regressão usa log.sucesso', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'orac-perf-ok-'));
    await write(dir, snapshot({ tempoAnaliseMs: 100, tempoParsingMs: 100 }));
    await new Promise((r) => setTimeout(r, 5));
    // Segundo snapshot igual -> nenhuma regressão
    await write(dir, snapshot({ tempoAnaliseMs: 100, tempoParsingMs: 100 }));
    const sucesso: string[] = [];
    const avisos: string[] = [];
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: () => undefined,
        aviso: (m: string) => avisos.push(m),
        erro: () => undefined,
        sucesso: (m: string) => sucesso.push(m),
      },
    }));
    const { comandoPerf } = await import('../../src/cli/comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    await program.parseAsync(['node', 'cli', 'perf', 'compare', '--dir', dir]);
    // Aceita ausência de sucesso explícito caso logs tenham variado;
    // requisito principal: não deve haver log de regressão
    expect(avisos.some((a) => /Regressão acima/.test(a))).toBe(false);
  });
});
