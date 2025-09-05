// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';

describe('analista-todo-comments', () => {
  it('detecta TODO em comentário de linha e bloco', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    const src = [
      'const a = 1; // TODO ajustar X',
      '/*',
      '  TODO: implementar Y',
      '*/',
      'console.log(a);',
    ].join('\n');
    const ocorrencias = analistaTodoComments.aplicar(src, 'src/app.ts') as any[];
    expect(Array.isArray(ocorrencias)).toBe(true);
    expect(ocorrencias.length).toBe(2);
    expect(ocorrencias[0].tipo).toBe('TODO_PENDENTE');
    expect(ocorrencias[1].tipo).toBe('TODO_PENDENTE');
  });

  it('retorna null se não houver TODOs', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    const src = 'const a = 1;\n// ok\n/* comentario */';
    const r = analistaTodoComments.aplicar(src, 'src/app.ts');
    expect(r).toBeNull();
  });

  it('test() ignora arquivos de teste e não-código e evita auto-detecção', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    expect(analistaTodoComments.test('tests/unit/foo.test.ts')).toBe(false);
    expect(analistaTodoComments.test('specs/foo.spec.js')).toBe(false);
    expect(analistaTodoComments.test('docs/readme.md')).toBe(false);
    expect(analistaTodoComments.test('src/code.ts')).toBe(true);
    expect(analistaTodoComments.test('src/code.js')).toBe(true);
    expect(analistaTodoComments.test('src/analistas/analista-todo-comments.ts')).toBe(false);
  });

  it('aplicar retorna null quando src vazio ou auto-detecção', async () => {
    const { analistaTodoComments } = await import('../../src/analistas/analista-todo-comments.js');
    expect(analistaTodoComments.aplicar('', 'src/code.ts')).toBeNull();
    expect(
      analistaTodoComments.aplicar('// TODO x', 'src/analistas/analista-todo-comments.ts'),
    ).toBeNull();
  });
});
// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { analistaTodoComments } from '../../src/analistas/analista-todo-comments.js';

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
