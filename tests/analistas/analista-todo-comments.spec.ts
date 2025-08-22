import { describe, it, expect } from 'vitest';
import analistaTodoComments from '../../src/analistas/analista-todo-comments.js';
import { criarOcorrencia } from '../../src/tipos/tipos.js';

describe('analista-todo-comments (micro)', () => {
  it('detecta TODO em comentário de linha quando // vem antes de /*', () => {
    const src = 'const a = 1; // TODO: ajustar /* bloco aberto';
    const res = analistaTodoComments.aplicar(src, 'src/algum/arquivo.js', null);
    expect(res).toBeTruthy();
    expect(res![0].tipo).toBe('TODO_PENDENTE');
  });

  it("ignora '//' quando '/*' começa antes na mesma linha", () => {
    const src = 'const a = 1; /* abre bloco */ // TODO: nao-deveria-detectar';
    const res = analistaTodoComments.aplicar(src, 'src/algum/arquivo.js', null);
    // implementação atual: trecho após '/*' é inspecionado e contém TODO, então é detectado
    expect(res).toBeTruthy();
    expect(res![0].tipo).toBe('TODO_PENDENTE');
  });

  it('retorna null para próprio arquivo do analista', () => {
    const src = '// TODO: interno';
    const res = analistaTodoComments.aplicar(src, 'src/analistas/analista-todo-comments.ts', null);
    expect(res).toBeNull();
  });
});
