// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';

describe('analista-todo-comments — falsos positivos em strings (fallback sem AST)', () => {
  it('não reporta quando TODO aparece dentro de string', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    const src = [
      'const a = "TODO: isto é apenas texto";',
      "const b = 'todo em minusculo dentro da string';",
      'const c = `prefix TODO sufix`;',
    ].join('\n');
    const res = analistaTodoComments.aplicar(src, 'src/x.ts', null as any);
    expect(res).toBeNull();
  });

  it('não reporta quando // ou /* aparecem dentro de strings', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    const src = [
      'const url = "http://example.com";',
      "const fake = '/* TODO nada aqui */';",
      'const also = `// TODO aqui é texto`;',
      'const mix = "http://x.com/path?y=1#//not-comment";',
    ].join('\n');
    const res = analistaTodoComments.aplicar(src, 'src/y.ts', null as any);
    expect(res).toBeNull();
  });

  it('não reporta TODO quando há escapes e backticks aninhados em strings', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    const src = [
      'const s1 = "\\"TODO\\" entre aspas escapadas";',
      "const s2 = '\\'// TODO\\' ainda string';",
      'const templ = `texto com crase \` e marcador TODO dentro do template`;',
    ].join('\n');
    const res = analistaTodoComments.aplicar(src, 'src/w.ts', null as any);
    expect(res).toBeNull();
  });

  it('ainda reporta quando TODO está em comentário real (linha e bloco)', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    const src = ['const a = 1; // TODO ajustar', '/* TODO: implementar depois */'].join('\n');
    const res = analistaTodoComments.aplicar(src, 'src/z.ts', null as any);
    expect(Array.isArray(res)).toBe(true);
    if (Array.isArray(res)) {
      // Deve encontrar pelo menos 2 (linha + bloco)
      expect(res.length).toBeGreaterThanOrEqual(2);
      expect(res[0].tipo).toBe('TODO_PENDENTE');
    }
  });
});
