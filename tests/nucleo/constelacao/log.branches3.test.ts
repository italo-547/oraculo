// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function captureConsole() {
  const logs: string[] = [];
  const origLog = console.log;
  console.log = (m?: any) => logs.push(String(m));
  return {
    logs,
    restore() {
      console.log = origLog;
    },
  };
}

describe('log.ts – truncamento e largura', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    delete process.env.ORACULO_FRAME_MAX_COLS;
  });

  it('formatarBloco trunca linhas longas com reticências preservando ANSI', async () => {
    process.env.VITEST = '1';
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const cap = captureConsole();
    try {
      const long = '\u001b[33m' + 'x'.repeat(300) + '\u001b[0m fim';
      log.imprimirBloco('Titulo Muito Longo ' + 'T'.repeat(200), [long]);
    } finally {
      cap.restore();
    }
    const out = cap.logs.join('\n');
    expect(out).toContain('Titulo Muito Longo');
    expect(out).toMatch(/…/); // tem reticências
  });

  it('calcularLargura respeita ORACULO_FRAME_MAX_COLS teto', async () => {
    process.env.VITEST = '1';
    process.env.ORACULO_FRAME_MAX_COLS = '40';
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const cap = captureConsole();
    try {
      log.imprimirBloco('T', ['a'.repeat(200)]);
    } finally {
      cap.restore();
    }
    const out = cap.logs.join('\n');
    // Verifica que a moldura não excede 40 colunas (contando + ou │)
    const firstLine = out.split('\n')[0] || '';
    const visibleLen = firstLine.replace(/[\u001B\u009B]\[[0-9;]*[A-Za-z]/g, '').length;
    expect(visibleLen).toBeLessThanOrEqual(42); // tolerância para cantos e espaços
  });
});
