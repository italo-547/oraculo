import { describe, it, expect } from 'vitest';
import {
  criarAnalista,
  ocorrenciaErroAnalista,
  ocorrenciaFuncaoComplexa,
  ocorrenciaParseErro,
  criarOcorrencia,
} from './tipos.js';

describe('tipos helpers branches', () => {
  it('criarAnalista valida definição e congela objeto', () => {
    const analista = criarAnalista({ nome: 'analista-exemplo', aplicar: () => null });
    expect(Object.isFrozen(analista)).toBe(true);
  });

  it('criarAnalista falha com definição inválida', () => {
    expect(() => criarAnalista(null as any)).toThrow();
    expect(() => criarAnalista({ nome: 'x' } as any)).toThrow();
  });

  it('builders de ocorrencia produzem campos mínimos e trim', () => {
    const o1 = ocorrenciaErroAnalista({ mensagem: ' teste ' });
    const o2 = ocorrenciaFuncaoComplexa({ mensagem: 'abc', linhas: 10 });
    const o3 = ocorrenciaParseErro({ mensagem: ' parse ' });
    const o4 = criarOcorrencia({ tipo: 'X', mensagem: '  msg  ' });
    expect(o1.mensagem).toBe('teste');
    expect(o2.tipo).toBe('FUNCAO_COMPLEXA');
    expect(o3.nivel).toBe('erro');
    expect(o4.mensagem).toBe('msg');
  });
});
