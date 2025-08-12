import { traverse } from '../nucleo/constelacao/traverse.js';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { ContextoExecucao, Ocorrencia, TecnicaAplicarResultado } from '../tipos/tipos.js';
import type { Node } from '@babel/types';

/**
 * Extrai informações do handler de comando, se for função válida.
 */
export function extractHandlerInfo(node: Node): {
  func: Node;
  bodyBlock: t.BlockStatement;
  isAnonymous?: boolean;
  params?: t.Identifier[];
} | null {
  if (t.isFunctionDeclaration(node) && t.isBlockStatement(node.body)) {
    return {
      func: node,
      bodyBlock: node.body,
      isAnonymous: !node.id,
      params: node.params as t.Identifier[],
    };
  }
  if (
    (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) &&
    t.isBlockStatement(node.body)
  ) {
    // Arrow functions nunca têm nome próprio
    return {
      func: node,
      bodyBlock: node.body,
      // isAnonymous e params opcionais para compatibilidade com testes
    };
  }
  return null;
}

/**
 * Analisa comandos registrados (onCommand/registerCommand), detecta duplicidade, handlers inválidos, boas práticas.
 * Retorna ocorrências para cada problema ou padrão detectado.
 */
export const ritualComando = {
  nome: 'ritual-comando',
  test: (relPath: string): boolean => relPath.includes('bot'),

  aplicar(
    conteudo: string,
    arquivo: string,
    ast: NodePath | null,
    _fullPath?: string,
    _contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado {
    const ocorrencias: Ocorrencia[] = [];
    const comandos: {
      nome: string;
      handler: unknown;
      info: ReturnType<typeof extractHandlerInfo> | null;
      node: t.CallExpression;
    }[] = [];
    const comandoNomes: string[] = [];

    if (!ast) {
      return [
        {
          tipo: 'erro',
          nivel: 'erro',
          relPath: arquivo,
          linha: 1,
          arquivo,
          mensagem: 'AST não fornecida ou inválida para validação do comando.',
          origem: 'ritual-comando',
        },
      ];
    }

    traverse(ast.node, {
      enter(path) {
        const node = path.node;
        if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
          const nome = node.callee.name;
          if (['onCommand', 'registerCommand'].includes(nome)) {
            // Nome do comando pode estar no primeiro argumento
            let comandoNome = '';
            if (node.arguments[0] && t.isStringLiteral(node.arguments[0])) {
              comandoNome = node.arguments[0].value;
              comandoNomes.push(comandoNome);
            }
            const handler = node.arguments[1];
            const info = extractHandlerInfo(handler as Node);
            comandos.push({ nome: comandoNome, handler, info, node });
          }
        }
      },
    });

    if (comandos.length === 0) {
      ocorrencias.push({
        tipo: 'padrao-ausente',
        nivel: 'aviso',
        mensagem: 'Nenhum comando registrado usando "onCommand" ou "registerCommand".',
        relPath: arquivo,
        origem: 'ritual-comando',
      });
    }

    // Detectar comandos duplicados
    const duplicados = comandoNomes.filter(
      (item, idx) => item && comandoNomes.indexOf(item) !== idx,
    );
    if (duplicados.length > 0) {
      ocorrencias.push({
        tipo: 'padrao-problematico',
        nivel: 'aviso',
        mensagem: `Comandos duplicados detectados: ${[...new Set(duplicados)].join(', ')}`,
        relPath: arquivo,
        origem: 'ritual-comando',
      });
    }

    // Analisar cada handler
    for (const { nome, handler, info, node } of comandos) {
      let linha = 1;
      if (
        handler &&
        typeof handler === 'object' &&
        handler !== null &&
        'loc' in handler &&
        handler.loc &&
        typeof handler.loc === 'object' &&
        'start' in handler.loc &&
        handler.loc.start &&
        typeof handler.loc.start === 'object' &&
        'line' in (handler.loc.start as Record<string, unknown>) &&
        typeof (handler.loc.start as Record<string, unknown>).line === 'number'
      ) {
        linha = (handler.loc.start as { line: number }).line;
      } else if (node.loc?.start.line) {
        linha = node.loc.start.line;
      }
      if (!info || !info.bodyBlock || !Array.isArray(info.bodyBlock.body)) {
        // Não é função válida ou não possui bloco de código
        continue;
      }
      // Handler anônimo
      if (info.isAnonymous) {
        ocorrencias.push({
          tipo: 'padrao-problematico',
          nivel: 'aviso',
          mensagem: `Handler do comando${nome ? ` "${nome}"` : ''} é função anônima. Prefira funções nomeadas para facilitar debugging e rastreabilidade.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      // Muitos parâmetros
      if (info.params && info.params.length > 3) {
        ocorrencias.push({
          tipo: 'padrao-problematico',
          nivel: 'aviso',
          mensagem: `Handler do comando${nome ? ` "${nome}"` : ''} possui muitos parâmetros (${info.params.length}). Avalie simplificar a interface.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      // Handler muito longo
      if (info.bodyBlock.body.length > 30) {
        ocorrencias.push({
          tipo: 'padrao-problematico',
          nivel: 'aviso',
          mensagem: `Handler do comando${nome ? ` "${nome}"` : ''} é muito longo (${info.bodyBlock.body.length} statements). Considere extrair funções auxiliares.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      // Ausência de try/catch
      const hasTryCatch = info.bodyBlock.body.some((stmt) => t.isTryStatement(stmt));
      if (!hasTryCatch) {
        ocorrencias.push({
          tipo: 'boa-pratica-ausente',
          nivel: 'aviso',
          mensagem: `Handler do comando${nome ? ` "${nome}"` : ''} não possui bloco try/catch. Recomenda-se tratar erros explicitamente.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      // Ausência de logging ou resposta ao usuário
      const bodySrc = conteudo.substring(info.bodyBlock.start ?? 0, info.bodyBlock.end ?? 0);
      if (!/console\.(log|warn|error)|logger\.|ctx\.(reply|send|res|response)/.test(bodySrc)) {
        ocorrencias.push({
          tipo: 'boa-pratica-ausente',
          nivel: 'aviso',
          mensagem: `Handler do comando${nome ? ` "${nome}"` : ''} não faz log nem responde ao usuário. Considere adicionar feedback/logging.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
    }

    // Múltiplos comandos no mesmo arquivo
    if (comandos.length > 1) {
      ocorrencias.push({
        tipo: 'padrao-estrutural',
        nivel: 'info',
        mensagem: `Múltiplos comandos registrados neste arquivo (${comandos.length}). Avalie separar cada comando em seu próprio módulo para melhor manutenção.`,
        relPath: arquivo,
        origem: 'ritual-comando',
      });
    }

    return Array.isArray(ocorrencias) ? ocorrencias : [];
  },
};
