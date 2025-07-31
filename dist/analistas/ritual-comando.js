import { traverse } from '../nucleo/constelacao/traverse.js';
import * as t from '@babel/types';
function extractHandlerInfo(node) {
    if (node && t.isFunctionDeclaration(node) && t.isBlockStatement(node.body)) {
        return { func: node, bodyBlock: node.body };
    }
    if (node &&
        (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) &&
        t.isBlockStatement(node.body)) {
        return { func: node, bodyBlock: node.body };
    }
    return null;
}
export const ritualComando = {
    nome: 'ritual-comando',
    test: (relPath) => relPath.includes('bot'),
    aplicar(conteudo, arquivo, ast, fullPath, contexto) {
        const ocorrencias = [];
        const encontrados = new Set();
        let handlerNode = null;
        if (!ast) {
            return [
                {
                    tipo: 'erro',
                    nivel: 'erro',
                    relPath: arquivo,
                    linha: 1,
                    arquivo,
                    mensagem: 'AST não fornecida ou inválida para validação do comando.',
                    origem: 'ritual-comando'
                }
            ];
        }
        traverse(ast, {
            enter(path) {
                const node = path.node;
                if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
                    const nome = node.callee.name;
                    if (['onCommand', 'registerCommand'].includes(nome)) {
                        const arg = node.arguments[1];
                        const info = extractHandlerInfo(arg);
                        if (info) {
                            encontrados.add(nome);
                            handlerNode = info.func;
                        }
                    }
                }
            }
        });
        if (encontrados.size === 0) {
            ocorrencias.push({
                tipo: 'padrao-ausente',
                nivel: 'aviso',
                mensagem: 'Nenhum comando registrado usando "onCommand" ou "registerCommand".',
                relPath: arquivo,
                origem: 'ritual-comando'
            });
        }
        return ocorrencias;
    }
};
