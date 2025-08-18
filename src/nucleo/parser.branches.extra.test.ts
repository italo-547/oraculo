// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { decifrarSintaxe } from './parser.js';

describe('parser extra branches', () => {
  it('retorna null para extensão não suportada', async () => {
    const r = await decifrarSintaxe('console.log(1)', '.desconhecida');
    expect(r).toBeNull();
  });

  it('parse Java inválido retorna null e válido retorna wrapper', async () => {
    const invalido = await decifrarSintaxe('class {', '.java');
    expect(invalido).toBeNull();
    const valido = await decifrarSintaxe('class A { }', '.java');
    expect(valido).not.toBeNull();
    expect((valido as any).oraculoExtra?.lang).toBe('java');
  });

  it('parse XML inválido cai em catch e válido funciona', async () => {
    const invalido = await decifrarSintaxe('<a', '.xml');
    expect(invalido).toBeNull();
    const valido = await decifrarSintaxe('<a></a>', '.xml');
    expect(valido).not.toBeNull();
    expect((valido as any).oraculoExtra?.lang).toBe('xml');
  });

  it('parse CSS retorna wrapper (aceita input mesmo potencialmente inválido)', async () => {
    const invalidoOuNao = await decifrarSintaxe('body { color: }', '.css');
    expect(invalidoOuNao).not.toBeNull();
    const valido = await decifrarSintaxe('body { color: red; }', '.css');
    expect(valido).not.toBeNull();
    expect((valido as any).oraculoExtra?.lang).toBe('css');
  });

  it('parse HTML simples retorna wrapper', async () => {
    const html = await decifrarSintaxe('<div>ok</div>', '.html');
    expect(html).not.toBeNull();
    expect((html as any).oraculoExtra?.lang).toBe('html');
  });

  it('parse Gradle heurístico extrai plugins e deps', async () => {
    const gradle = `plugins { id "java" }\ndependencies { implementation "org.example:lib:1.0" }`;
    const res = await decifrarSintaxe(gradle, '.gradle');
    expect(res).not.toBeNull();
    expect((res as any).oraculoExtra?.rawAst?.plugins).toContain('java');
    expect((res as any).oraculoExtra?.rawAst?.deps[0]).toContain('org.example:lib');
  });
});
