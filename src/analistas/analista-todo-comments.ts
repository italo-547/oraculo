import type { Analista, TecnicaAplicarResultado } from '../tipos/tipos.js';
import { criarOcorrencia } from '../tipos/tipos.js';

// Analista simples para detectar TODO em comentários (//, /* */), ignorando testes/specs
export const analistaTodoComments: Analista = {
  nome: 'todo-comments',
  categoria: 'qualidade',
  descricao: 'Detecta comentários TODO deixados no código (apenas em comentários).',
  test(relPath) {
    // Ignora arquivos de teste/spec e pastas comuns de teste
    if (
      /(^|\\|\/)tests?(\\|\/)/i.test(relPath) ||
      /\.(test|spec)\.(ts|js|tsx|jsx)$/i.test(relPath)
    ) {
      return false;
    }
    // Evita auto-detecção neste próprio arquivo
    if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath)) return false;
    return /\.(ts|js|tsx|jsx)$/i.test(relPath);
  },
  aplicar(src, relPath): TecnicaAplicarResultado {
    if (!src) return null;
    // Evita auto-detecção neste próprio arquivo (defesa dupla)
    if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath)) return null;

    // Heurística: considera TODO apenas quando presente em comentários
    const linhas = src.split(/\r?\n/);
    const ocorrenciasLinhas: number[] = [];
    let emBloco = false;
    const isTodoComment = (texto: string): boolean => {
      const t = texto.trim();
      if (/^TODO\b/i.test(t)) return true; // começa com TODO (ex: "// TODO ajustar")
      return /\bTODO\b\s*[:\-(\[]/i.test(t); // TODO: ou TODO - ou TODO(
    };
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      let analisada = false;

      // Verifica comentários de bloco (/* ... */)
      if (emBloco) {
        analisada = true;
        if (isTodoComment(linha)) {
          ocorrenciasLinhas.push(i + 1);
        }
        if (linha.includes('*/')) {
          emBloco = false;
        }
      }

      if (!analisada) {
        // Procura início de bloco e comentário de linha
        const idxBlockStart = linha.indexOf('/*');
        const idxLine = linha.indexOf('//');

        // Caso comentário de linha
        if (idxLine >= 0 && (idxBlockStart === -1 || idxLine < idxBlockStart)) {
          const trechoComentario = linha.slice(idxLine + 2);
          if (isTodoComment(trechoComentario)) {
            ocorrenciasLinhas.push(i + 1);
          }
          continue;
        }

        // Caso bloco começando nesta linha
        if (idxBlockStart >= 0) {
          const trechoAposInicio = linha.slice(idxBlockStart + 2);
          if (isTodoComment(trechoAposInicio)) {
            ocorrenciasLinhas.push(i + 1);
          }
          if (!linha.includes('*/')) {
            emBloco = true;
          }
          continue;
        }
      }
    }

    if (ocorrenciasLinhas.length === 0) return null;

    return ocorrenciasLinhas.map((linha) =>
      criarOcorrencia({
        tipo: 'TODO_PENDENTE',
        mensagem: 'Comentário TODO encontrado',
        nivel: 'aviso',
        relPath,
        linha,
        origem: 'todo-comments',
      }),
    );
  },
};

export default analistaTodoComments;
