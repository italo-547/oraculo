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
});
