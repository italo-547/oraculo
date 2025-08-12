import type { Analista, TecnicaAplicarResultado } from '../tipos/tipos.js';
import { criarOcorrencia } from '../tipos/tipos.js';

// Analista de exemplo simples usado em documentação (detecta comentários TODO)
export const analistaTodoComments: Analista = {
  nome: 'todo-comments',
  categoria: 'qualidade',
  descricao: 'Detecta comentários TODO deixados no código.',
  test(relPath) {
    return /\.(ts|js|tsx|jsx)$/.test(relPath);
  },
  aplicar(src, relPath): TecnicaAplicarResultado {
    if (!src || !src.includes('TODO')) return null;
    const linhas = src.split(/\r?\n/);
    const ocorrencias = linhas
      .map((l, i) => (l.includes('TODO') ? i + 1 : null))
      .filter(Boolean)
      .map((linha) =>
        criarOcorrencia({
          tipo: 'TODO_PENDENTE',
          mensagem: 'Comentário TODO encontrado',
          nivel: 'aviso',
          relPath,
          linha: linha as number,
          origem: 'todo-comments',
        }),
      );
    return ocorrencias;
  },
};

export default analistaTodoComments;
