// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { analistaTodoComments } from './analista-todo-comments.js';

describe('analistaTodoComments', () => {
  it('retorna null se não há TODO', () => {
    const res = analistaTodoComments.aplicar('console.log(1);', 'a.ts', null as any);
    expect(res).toBeNull();
  });

  it('detecta TODO e gera ocorrências', () => {
    const res = analistaTodoComments.aplicar('// TODO ajustar\nconst x=1', 'b.ts', null as any);
    expect(Array.isArray(res)).toBe(true);
    if (Array.isArray(res)) {
      expect(res[0].tipo).toBe('TODO_PENDENTE');
      expect(res[0].linha).toBe(1);
    }
  });

  it('filtra por extensão', () => {
    expect(analistaTodoComments.test?.('x.ts')).toBe(true);
    expect(analistaTodoComments.test?.('x.txt')).toBe(false);
  });

  it('ignora arquivos de teste/spec e pastas tests/', () => {
    expect(analistaTodoComments.test?.('foo.test.ts')).toBe(false);
    expect(analistaTodoComments.test?.('bar.spec.js')).toBe(false);
    expect(analistaTodoComments.test?.('tests/foo.ts')).toBe(false);
  });

  it('detecta TODO dentro de comentário de bloco', () => {
    const src = '/*\n * TODO: ajustar fluxo X\n */\nconst a = 1;';
    const res = analistaTodoComments.aplicar(src, 'c.ts', null as any);
    expect(Array.isArray(res)).toBe(true);
    expect((res as any[])?.length).toBeGreaterThan(0);
    expect((res as any[])[0].tipo).toBe('TODO_PENDENTE');
  });

  it('não acusa falso positivo com palavras como "método" ou "todos"', () => {
    const src = '// método de exemplo\nconst todos = 2;';
    const res = analistaTodoComments.aplicar(src, 'd.ts', null as any);
    expect(res).toBe(null);
  });

  it('auto-exclusão: não reporta TODO quando o arquivo é o próprio analista', () => {
    const src = '// TODO: algo aqui';
    const res = analistaTodoComments.aplicar(
      src,
      'src/analistas/analista-todo-comments.ts',
      null as any,
    );
    expect(res).toBe(null);
    expect(analistaTodoComments.test?.('src/analistas/analista-todo-comments.ts')).toBe(false);
  });
});
