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

describe('log.ts – branches adicionais', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...process.env };
  });

  afterEach(() => {
    delete (process.stdout as any).isTTY;
    delete process.env.ORACULO_CENTER;
    delete process.env.ORACULO_ASCII_FRAMES;
    delete process.env.ORACULO_NO_UNICODE;
    delete process.env.ORACULO_FRAME_MAX_COLS;
  });

  it('centraliza linhas quando ORACULO_CENTER=1 e TTY presente', async () => {
    // Habilita centralização e simula TTY com largura fixa
    delete process.env.VITEST; // caminho de centralização só roda quando não há VITEST
    process.env.ORACULO_CENTER = '1';
    process.env.ORACULO_FRAME_MAX_COLS = '120';
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });

    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const cap = captureConsole();
    try {
      log.info('teste centralizado');
    } finally {
      cap.restore();
    }
    const first = cap.logs[0] || '';
    // Deve adicionar espaços à esquerda (centralização)
    expect(first.startsWith(' ')).toBe(true);
  });

  it('imprimirBloco usa moldura ASCII quando ORACULO_ASCII_FRAMES=1', async () => {
    process.env.VITEST = '1'; // evita centralização de bloco
    process.env.ORACULO_ASCII_FRAMES = '1';
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const cap = captureConsole();
    try {
      log.imprimirBloco('Titulo', ['linha A', 'linha B']);
    } finally {
      cap.restore();
    }
    const out = cap.logs.join('\n');
    expect(out).toMatch(/[+\-|]/); // caracteres ASCII da moldura
    expect(out).not.toMatch(/[┌┐└┘│─]/); // não deve conter moldura unicode
  });

  it('desabilita unicode quando ORACULO_NO_UNICODE=1', async () => {
    process.env.ORACULO_NO_UNICODE = '1';
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const simbolos = (log as unknown as { simbolos: Record<string, string> }).simbolos;
    expect(simbolos.sucesso).toBe('ok');
    expect(simbolos.erro).toBe('x');
  });
});
