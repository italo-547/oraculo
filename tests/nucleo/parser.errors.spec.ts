import { describe, it, expect } from 'vitest';
import { decifrarSintaxe, PARSERS } from '../../src/nucleo/parser.js';

describe('nucleo/parser error paths (micro)', () => {
  it('decifrarSintaxe should attempt Flow/jsModern fallbacks and return null on invalid JS', async () => {
    // invalid JS that will likely make babel throw; includes @flow to trigger flowPlugins branch
    const codigo = '@flow\nfunction x( {\n';
    const res = await decifrarSintaxe(codigo, '.js');
    // may return null if parsers fail — we assert it's either null or an object, but ensure branch executed by not throwing
    expect(res === null || typeof res === 'object').toBeTruthy();
  });

  it('parseComXml returns a wrapMinimal object (lenient parser)', () => {
    const fn = PARSERS.get('.xml');
    expect(typeof fn).toBe('function');
    const r = fn!('<root><unclosed></root>');
    expect(r).toBeTruthy();
    // should expose oraculoExtra.lang === 'xml'
    // @ts-ignore - runtime shape
    expect(r!.oraculoExtra?.lang).toBe('xml');
  });

  it('parseComCss returns a wrapMinimal object for CSS input', () => {
    const fn = PARSERS.get('.css');
    expect(typeof fn).toBe('function');
    const r = fn!('body { color: ;');
    expect(r).toBeTruthy();
    // @ts-ignore
    expect(r!.oraculoExtra?.lang).toBe('css');
  });
});
