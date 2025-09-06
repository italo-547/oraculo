// SPDX-License-Identifier: MIT
import type { Analista, TecnicaAplicarResultado } from '@tipos/tipos.js';
import { criarOcorrencia } from '@tipos/tipos.js';
import type { NodePath } from '@babel/traverse';
import type { Comment } from '@babel/types';

// Analista simples para detectar TODO em comentários (//, /* */), ignorando testes/specs
export const analistaTodoComments: Analista = {
  nome: 'todo-comments',
  categoria: 'qualidade',
  descricao: 'Detecta comentários TODO deixados no código (apenas em comentários).',
  // Per-file (não global): executa por arquivo
  global: false,
  test(relPath) {
    // Ignora arquivos de teste/spec e pastas comuns de teste
    if (
      /(^|\\|\/)tests?(\\|\/)/i.test(relPath) ||
      /\.(test|spec)\.(ts|js|tsx|jsx)$/i.test(relPath)
    ) {
      return false;
    }
    // Delega escopo ao scanner/CLI: não restringe por caminho aqui
    // normalização não é necessária aqui; scanner controla escopo
    // Evita auto-detecção neste próprio arquivo
    if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath)) return false;
    return /\.(ts|js|tsx|jsx)$/i.test(relPath);
  },
  aplicar(src, relPath, ast?: NodePath | null): TecnicaAplicarResultado {
    const RE_TODO_START = /^TODO\b/i;
    const RE_TODO_ANY = /\bTODO\b\s*[:\-(\[]/i;
    const isTodoComment = (texto: string): boolean => {
      const t = String(texto ?? '').trim();
      return RE_TODO_START.test(t) || RE_TODO_ANY.test(t);
    };

    // Localiza marcadores de comentário ignorando ocorrências dentro de strings (', ", `)
    const localizarMarcadores = (linha: string): { lineIdx: number; blockIdx: number } => {
      let inS = false;
      let inD = false;
      let inB = false;
      let prev = '';
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        const pair = prev + ch;
        // alterna estados de string considerando escapes simples
        if (!inD && !inB && ch === "'" && prev !== '\\') inS = !inS;
        else if (!inS && !inB && ch === '"' && prev !== '\\') inD = !inD;
        else if (!inS && !inD && ch === '`' && prev !== '\\') inB = !inB;

        // apenas quando não dentro de strings detectar comentários
        if (!inS && !inD && !inB) {
          if (pair === '//') {
            return { lineIdx: i - 1, blockIdx: -1 };
          }
          if (pair === '/*') {
            return { lineIdx: -1, blockIdx: i - 1 };
          }
        }
        prev = ch;
      }
      return { lineIdx: -1, blockIdx: -1 };
    };
    if (!src || typeof src !== 'string') return null;
    // Evita auto-detecção neste próprio arquivo (defesa dupla)
    if (/analistas[\\\/]analista-todo-comments\.(ts|js)$/i.test(relPath)) return null;

    // Caminho preferencial: usar comentários da AST quando disponível
  if (ast && ast.node) {
      const maybeWithComments = ast.node as unknown as { comments?: Comment[] };
      if (Array.isArray(maybeWithComments.comments)) {
        const comments = maybeWithComments.comments;
        const ocorrencias = comments
          .filter((c) => {
      const texto = String(c.value ?? '').trim();
      return isTodoComment(texto);
          })
          .map((c) =>
            criarOcorrencia({
              tipo: 'TODO_PENDENTE',
              mensagem: 'Comentário TODO encontrado',
              nivel: 'aviso',
              relPath,
              linha: c.loc?.start.line,
              origem: 'todo-comments',
            }),
          );
        return ocorrencias.length ? ocorrencias : null;
      }
    }

    // Heurística: considera TODO apenas quando presente em comentários
  const linhas = src.split(/\r?\n/);
    const ocorrenciasLinhas: number[] = [];
    let emBloco = false;
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
    // Procura início de bloco e comentário de linha ignorando strings
    const { blockIdx: idxBlockStart, lineIdx: idxLine } = localizarMarcadores(linha);

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
