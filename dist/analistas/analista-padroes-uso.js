// SPDX-License-Identifier: MIT
// src/analistas/analista-padroes-uso.ts
import * as t from '@babel/types';
import { traverse } from '@nucleo/constelacao/traverse.js';
import { incrementar, garantirArray } from '@zeladores/util/helpers-analistas.js';
import { criarOcorrencia, ocorrenciaErroAnalista } from '@tipos/tipos.js';
// Estatísticas globais (mantidas)
export const estatisticasUsoGlobal = {
    requires: {},
    consts: {},
    exports: {},
    vars: {},
    lets: {},
    evals: {},
    withs: {},
};
export const analistaPadroesUso = {
    nome: 'analista-padroes-uso',
    global: false,
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    aplicar: (_src, relPath, astInput, _fullPath, contexto) => {
        // Per-file: não exige contexto; ele é usado apenas como fallback para localizar AST
        const ocorrencias = [];
        const push = (data) => {
            ocorrencias.push(criarOcorrencia({
                nivel: data.nivel,
                origem: data.origem,
                tipo: data.tipo,
                mensagem: data.mensagem,
                relPath: data.arquivo || data.relPath,
                linha: data.linha,
                coluna: data.coluna,
            }));
        };
        const statsFlag = estatisticasUsoGlobal;
        if (!statsFlag.___RESET_DONE___) {
            estatisticasUsoGlobal.requires = {};
            estatisticasUsoGlobal.consts = {};
            estatisticasUsoGlobal.exports = {};
            estatisticasUsoGlobal.vars = {};
            estatisticasUsoGlobal.lets = {};
            estatisticasUsoGlobal.evals = {};
            estatisticasUsoGlobal.withs = {};
            statsFlag.___RESET_DONE___ = true;
        }
        // Normaliza AST recebido do executor (pode ser { node } ou o nó direto); fallback ao contexto
        let astWrap = astInput;
        if (!astWrap && contexto?.arquivos) {
            const found = contexto.arquivos.find((f) => f.relPath === relPath) || contexto.arquivos[0];
            astWrap = found?.ast || undefined;
        }
        const ast = (astWrap && astWrap.node) || astWrap;
        if (!ast || typeof ast !== 'object')
            return null;
        const tipo = ast.type;
        if (tipo !== 'File' && tipo !== 'Program')
            return null; // evita traverse inválido
        try {
            traverse(ast, {
                enter(path) {
                    const node = path.node;
                    if (t.isVariableDeclaration(node) && node.kind === 'var') {
                        incrementar(estatisticasUsoGlobal.vars, relPath);
                        push({
                            tipo: 'alerta',
                            mensagem: `Uso de 'var' detectado. Prefira 'let' ou 'const'.`,
                            arquivo: relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if (t.isVariableDeclaration(node) && node.kind === 'let') {
                        incrementar(estatisticasUsoGlobal.lets, relPath);
                        push({
                            tipo: 'info',
                            mensagem: `Uso de 'let'. Considere 'const' se não houver reatribuição.`,
                            arquivo: relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if (t.isVariableDeclaration(node) && node.kind === 'const') {
                        incrementar(estatisticasUsoGlobal.consts, relPath);
                    }
                    if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
                        const nome = node.callee.name;
                        if (nome === 'require') {
                            incrementar(estatisticasUsoGlobal.requires, relPath);
                            if (relPath.endsWith('.ts')) {
                                push({
                                    tipo: 'alerta',
                                    mensagem: `Uso de 'require' em arquivo TypeScript. Prefira 'import'.`,
                                    arquivo: relPath,
                                    linha: node.loc?.start.line,
                                    coluna: node.loc?.start.column,
                                });
                            }
                        }
                        if (nome === 'eval') {
                            incrementar(estatisticasUsoGlobal.evals, relPath);
                            push({
                                tipo: 'critico',
                                mensagem: `Uso de 'eval' detectado. Evite por questões de segurança e performance.`,
                                arquivo: relPath,
                                linha: node.loc?.start.line,
                                coluna: node.loc?.start.column,
                            });
                        }
                    }
                    if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
                        incrementar(estatisticasUsoGlobal.exports, relPath);
                    }
                    if (t.isAssignmentExpression(node) &&
                        t.isMemberExpression(node.left) &&
                        ((t.isIdentifier(node.left.object) &&
                            node.left.object.name === 'module' &&
                            t.isIdentifier(node.left.property) &&
                            node.left.property.name === 'exports') ||
                            (t.isIdentifier(node.left.object) && node.left.object.name === 'exports')) &&
                        relPath.endsWith('.ts')) {
                        push({
                            tipo: 'alerta',
                            mensagem: `Uso de 'module.exports' ou 'exports' em arquivo TypeScript. Prefira 'export'.`,
                            arquivo: relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if (t.isWithStatement(node)) {
                        incrementar(estatisticasUsoGlobal.withs, relPath);
                        push({
                            tipo: 'critico',
                            mensagem: `Uso de 'with' detectado. Evite por questões de legibilidade e escopo.`,
                            arquivo: relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    if ((t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) &&
                        !node.id &&
                        !t.isArrowFunctionExpression(node)) {
                        push({
                            tipo: 'info',
                            mensagem: `Função anônima detectada. Considere nomear funções para melhor rastreabilidade.`,
                            arquivo: relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                    // Arrow function em propriedade de classe (Babel 7+: ClassProperty/PropertyDefinition)
                    if ((node.type === 'ClassProperty' ||
                        node.type === 'PropertyDefinition') &&
                        'value' in node &&
                        t.isArrowFunctionExpression(node.value)) {
                        push({
                            tipo: 'info',
                            mensagem: `Arrow function usada como método de classe. Prefira método tradicional para melhor herança.`,
                            arquivo: relPath,
                            linha: node.loc?.start.line,
                            coluna: node.loc?.start.column,
                        });
                    }
                },
            });
        }
        catch (e) {
            ocorrencias.push(ocorrenciaErroAnalista({
                mensagem: `Falha ao analisar padrões de uso em ${relPath}: ${e.message}`,
                relPath,
                origem: 'analista-padroes-uso',
            }));
        }
        return garantirArray(ocorrencias);
    },
};
//# sourceMappingURL=analista-padroes-uso.js.map