// SPDX-License-Identifier: MIT
import { traverse } from '../nucleo/constelacao/traverse.js';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { ContextoExecucao, Ocorrencia, TecnicaAplicarResultado } from '../tipos/tipos.js';
import type { Node } from '@babel/types';

/**
 * Extrai informações do handler de comando, se for função válida.
 */
export interface HandlerInfo {
  func: Node;
  bodyBlock: t.BlockStatement;
  isAnonymous: boolean;
  params: t.Identifier[];
  totalParams: number;
}

export function extractHandlerInfo(node: unknown): HandlerInfo | null {
  if (!node || typeof node !== 'object') return null;
  // Usa any temporário para permitir checagens estruturais antes de delegar ao tipo de @babel/types
  const n: any = node; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (t.isFunctionDeclaration(n) && n.body && t.isBlockStatement(n.body)) {
    const rawParams = Array.isArray(n.params) ? n.params : [];
    const params: t.Identifier[] = rawParams.filter((p): p is t.Identifier => t.isIdentifier(p));
    return {
      func: n,
      bodyBlock: n.body,
      isAnonymous: !n.id,
      params,
      totalParams: rawParams.length,
    };
  }
  if (
    (t.isFunctionExpression(n) || t.isArrowFunctionExpression(n)) &&
    n.body &&
    t.isBlockStatement(n.body)
  ) {
    const rawParams = Array.isArray(n.params) ? n.params : [];
    const params: t.Identifier[] = rawParams.filter((p): p is t.Identifier => t.isIdentifier(p));
    const isAnonymous = t.isFunctionExpression(n) ? !n.id : true;
    return { func: n, bodyBlock: n.body, isAnonymous, params, totalParams: rawParams.length };
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
    interface ComandoRegistro {
      comandoNome: string; // nome lógico do comando
      handler: Node | undefined;
      info: HandlerInfo | null;
      node: t.CallExpression;
    }
    const comandos: ComandoRegistro[] = [];
    const comandoNomes: string[] = [];
    let comandosInvocados = 0;

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
        const nodeAtual = path.node;
        if (t.isCallExpression(nodeAtual) && t.isIdentifier(nodeAtual.callee)) {
          if (['onCommand', 'registerCommand'].includes(nodeAtual.callee.name)) {
            comandosInvocados++;
            let comandoNome = '';
            const primeiroArg = nodeAtual.arguments[0];
            if (primeiroArg && t.isStringLiteral(primeiroArg)) {
              comandoNome = primeiroArg.value;
              comandoNomes.push(comandoNome);
            }
            const handler = nodeAtual.arguments.length > 1 ? nodeAtual.arguments[1] : undefined;
            // Tentamos extrair informações mesmo em mocks parciais; extractHandlerInfo é defensiva
            const info = extractHandlerInfo(handler as unknown as Node);
            comandos.push({
              comandoNome,
              handler: handler as Node | undefined,
              info,
              node: nodeAtual,
            });
          }
        }
      },
    });

    if (comandosInvocados === 0) {
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
    for (const { comandoNome, handler, info, node } of comandos) {
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
        'line' in (handler.loc.start as unknown as Record<string, unknown>) &&
        typeof (handler.loc.start as unknown as Record<string, unknown>).line === 'number'
      ) {
        linha = (handler.loc.start as unknown as { line: number }).line;
      } else if (node.loc?.start.line) {
        linha = node.loc.start.line;
      }
      if (!info || !info.bodyBlock) {
        // Não é função válida
        continue;
      }
      // Aceita bloco mesmo se body estiver indefinido (considera vazio)
      const statements = Array.isArray(info.bodyBlock.body) ? info.bodyBlock.body : [];
      // Handler anônimo (só reporta se o comando tiver nome explícito)
      if (info.isAnonymous && comandoNome) {
        ocorrencias.push({
          tipo: 'padrao-problematico',
          nivel: 'aviso',
          mensagem: `Handler do comando "${comandoNome}" é função anônima. Prefira funções nomeadas para facilitar debugging e rastreabilidade.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      // Muitos parâmetros
      // Deriva quantidade de parâmetros sem recorrer a any
      // totalParams já é computado em extractHandlerInfo; fallback para length de params
      const paramCount = info.totalParams ?? info.params.length;
      if (paramCount > 3) {
        ocorrencias.push({
          tipo: 'padrao-problematico',
          nivel: 'aviso',
          mensagem: `Handler do comando${comandoNome ? ` "${comandoNome}"` : ''} possui muitos parâmetros (${paramCount}). Avalie simplificar a interface.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      // Handler muito longo
      if (statements.length > 30) {
        ocorrencias.push({
          tipo: 'padrao-problematico',
          nivel: 'aviso',
          mensagem: `Handler do comando${comandoNome ? ` "${comandoNome}"` : ''} é muito longo (${statements.length} statements). Considere extrair funções auxiliares.`,
          relPath: arquivo,
          linha,
          origem: 'ritual-comando',
        });
      }
      if (statements.length > 0) {
        // Ausência de try/catch
        const hasTryCatch = statements.some((stmt) => t.isTryStatement(stmt));
        if (!hasTryCatch) {
          ocorrencias.push({
            tipo: 'boa-pratica-ausente',
            nivel: 'aviso',
            mensagem: `Handler do comando${comandoNome ? ` "${comandoNome}"` : ''} não possui bloco try/catch. Recomenda-se tratar erros explicitamente.`,
            relPath: arquivo,
            linha,
            origem: 'ritual-comando',
          });
        }
        // Ausência de logging ou resposta ao usuário
        // Extrai trecho do conteúdo associado ao body (fallback: conteúdo inteiro se não houver offsets)
        const bodySlice =
          typeof info.bodyBlock.start === 'number' && typeof info.bodyBlock.end === 'number'
            ? conteudo.substring(info.bodyBlock.start, info.bodyBlock.end)
            : '';
        // Fallback para conteúdo completo se slice vazio ou muito curto (pode ter offsets artificiais em mocks de teste)
        const bodySrc = bodySlice && bodySlice.length > 5 ? bodySlice : conteudo;
        const regexLog = /console\.(log|warn|error)|logger\.|ctx\.(reply|send|res|response)/;
        if (!regexLog.test(bodySrc)) {
          // Fallback: se no conteúdo completo existir logging, não reporta
          if (!regexLog.test(conteudo)) {
            ocorrencias.push({
              tipo: 'boa-pratica-ausente',
              nivel: 'aviso',
              mensagem: `Handler do comando${comandoNome ? ` "${comandoNome}"` : ''} não faz log nem responde ao usuário. Considere adicionar feedback/logging.`,
              relPath: arquivo,
              linha,
              origem: 'ritual-comando',
            });
          }
        }
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

    // Debug temporário (pode ser removido depois) para entender ocorrências inesperadas em testes
    // Logs de debug removidos após estabilização dos testes.
    return Array.isArray(ocorrencias) ? ocorrencias : [];
  },
};
