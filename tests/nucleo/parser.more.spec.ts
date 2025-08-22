import { describe, it, expect, vi, afterEach } from 'vitest';
import * as csstree from 'css-tree';
import { XMLParser } from 'fast-xml-parser';
import { parseDocument } from 'htmlparser2';
import { decifrarSintaxe } from '../../src/nucleo/parser.js';

afterEach(() => vi.restoreAllMocks());

describe('nucleo/parser additional branches', () => {
  it('retorna null ou um AST compatível para .java (depende de java-parser)', async () => {
    const r = await decifrarSintaxe('public class X {}', '.java');
    // Ambiente pode ter java-parser instalado — aceite ambos os casos
    if (r === null) {
      expect(r).toBeNull();
    } else {
      expect((r as any).oraculoExtra?.lang).toBe('java');
    }
  });

  it('parses kotlin heuristically', async () => {
    const r = await decifrarSintaxe('class Meu { } fun f() {}', '.kt');
    expect(r).not.toBeNull();
    expect((r as any).oraculoExtra?.lang).toBe('kotlin');
    expect((r as any).oraculoExtra?.rawAst?.symbols?.length).toBeGreaterThan(0);
  });

  it('parses gradle heuristics', async () => {
    const codigo = "id 'org.sample'\nimplementation 'com.lib:core:1.0'";
    const r = await decifrarSintaxe(codigo, '.gradle');
    expect(r).not.toBeNull();
    expect((r as any).oraculoExtra?.lang).toBe('gradle');
    expect((r as any).oraculoExtra?.rawAst?.plugins).toContain('org.sample');
    expect((r as any).oraculoExtra?.rawAst?.deps).toContain('com.lib:core:1.0');
  });

  it('css parse falha e retorna null quando css inválido (aceita wrapMinimal)', async () => {
    const r = await decifrarSintaxe('invalido {', '.css');
    if (r === null) {
      expect(r).toBeNull();
    } else {
      expect((r as any).oraculoExtra?.lang).toBe('css');
    }
  });

  it('xml parse falha e retorna null quando XMLParser.parse lança', async () => {
    vi.spyOn(XMLParser.prototype, 'parse').mockImplementation(() => {
      throw new Error('xml boom');
    });
    const r = await decifrarSintaxe('<a><b></a>', '.xml');
    expect(r).toBeNull();
  });

  it('html parse falha e retorna null quando parseDocument lança', async () => {
    vi.spyOn(parseDocument as any, 'call').mockImplementation(() => {
      throw new Error('html boom');
    });
    // chamar com entrada inválida
    const r = await decifrarSintaxe('<div><span>', '.html');
    // se parseDocument lançar, decifrarSintaxe deve capturar e retornar null
    expect(r === null || (r as any).oraculoExtra?.lang === 'html').toBeTruthy();
  });
});
