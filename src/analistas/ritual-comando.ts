import { traverse } from '../nucleo/constelacao/traverse';
import * as t from '@babel/types';
import config from '../nucleo/constelacao/cosmos';
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
    test: relPath => relPath.includes('bot'),
    aplicar(conteudo, arquivo, ast, fullPath, contexto) {
        const ocorrencias = [];
        const encontrados = new Set();
        let handlerNode = null;
        if (!ast) {
            return [{
                    tipo: 'erro',
                    nivel: 'erro',
                    relPath: arquivo,
                    linha: 1,
                    arquivo,
                    mensagem: 'AST não fornecida ou inválida para validação do comando.',
                    origem: 'ritual-comando'
                }];
        }
        traverse(ast, {
            AssignmentExpression(path) {
                const { left, right } = path.node;
                if (t.isMemberExpression(left) &&
                    t.isIdentifier(left.object) &&
                    t.isIdentifier(left.property)) {
                    if (left.object.name === 'exports') {
                        encontrados.add(left.property.name);
                    }
                    if (left.object.name === 'module' &&
                        left.property.name === 'exports' &&
                        t.isObjectExpression(right)) {
                        right.properties.forEach(prop => {
                            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                                encontrados.add(prop.key.name);
                            }
                        });
                    }
                }
            },
            ExportNamedDeclaration(path) {
                const node = path.node;
                if (t.isVariableDeclaration(node.declaration)) {
                    node.declaration.declarations.forEach(d => {
                        if (t.isIdentifier(d.id)) {
                            encontrados.add(d.id.name);
                        }
                    });
                }
                node.specifiers?.forEach(s => {
                    if (t.isExportSpecifier(s) && t.isIdentifier(s.exported)) {
                        encontrados.add(s.exported.name);
                    }
                });
            },
            FunctionDeclaration(path) {
                if (path.node.id?.name === 'handler') {
                    handlerNode = path.node;
                    encontrados.add('handler');
                }
            },
            VariableDeclarator(path) {
                const { id, init } = path.node;
                if (t.isIdentifier(id) &&
                    id.name === 'handler' &&
                    init &&
                    (t.isFunctionExpression(init) || t.isArrowFunctionExpression(init))) {
                    handlerNode = init;
                    encontrados.add('handler');
                }
            }
        });
        for (const { name, missingType, resolucao } of config.BOT_VALIDATOR_RULES) {
            if (!encontrados.has(name)) {
                ocorrencias.push({
                    tipo: missingType,
                    nivel: missingType === 'erro' ? 'erro' : 'aviso',
                    relPath: arquivo,
                    linha: 1,
                    arquivo,
                    mensagem: `Propriedade obrigatória "${name}" não foi exportada.`,
                    resolucao,
                    origem: 'ritual-comando'
                });
            }
        }
        if (encontrados.has('handler') && handlerNode) {
            const info = extractHandlerInfo(handlerNode);
            if (info) {
                const { func, bodyBlock } = info;
                const temTry = bodyBlock.body.some((stmt) => t.isTryStatement(stmt));
                if (!temTry) {
                    ocorrencias.push({
                        tipo: 'aviso',
                        nivel: 'aviso',
                        relPath: arquivo,
                        linha: func.loc?.start.line ?? 1,
                        arquivo,
                        mensagem: 'Handler exportado não possui bloco try/catch.',
                        resolucao: 'Envolva o corpo do handler em um bloco try/catch.',
                        origem: 'ritual-comando'
                    });
                }
            }
        }
        return ocorrencias;
    }
};
