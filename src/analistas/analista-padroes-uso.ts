// src/analistas/analista-padroes-uso.ts
import * as t from '@babel/types';
import { traverse } from '../nucleo/constelacao/traverse.js';
import type { Estatisticas } from '../tipos/tipos.js'
// Objeto para armazenar as estatísticas acumuladas
export const estatisticasUsoGlobal = {
    requires: {},
    consts: {},
    exports: {}
};
// Função auxiliar para incrementar contadores
function incrementar(contador, chave) {
    contador[chave] = (contador[chave] ?? 0) + 1;
}
export const analistaPadroesUso = {
    nome: 'analista-padroes-uso',
    // Esta técnica agora é GLOBAL, pois acumula estatísticas de todo o projeto.
    // Ela será executada uma única vez após todos os arquivos terem sido parseados.
    global: true,
    // A função 'test' não é relevante para técnicas globais, mas pode ser mantida
    // para consistência ou para indicar que a análise é sobre JS/TS.
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    aplicar: (_src, // Não usado diretamente, pois a técnica processa todos os arquivos via contexto.
    _relPath, // Não usado diretamente
    _ast, // Não usado diretamente
    _fullPath, // Não usado
    contexto // O contexto é crucial para técnicas globais
    ) => {
        const ocorrencias = [];
        // Limpa as estatísticas no início da execução da técnica global
        // Isso é importante se o Oráculo for reutilizado em processos de longa duração
        estatisticasUsoGlobal.requires = {};
        estatisticasUsoGlobal.consts = {};
        estatisticasUsoGlobal.exports = {};
        if (!contexto || !contexto.arquivos) {
            ocorrencias.push({
                tipo: 'ERRO_TECNICA',
                codigo: 'FALHA_CONTEXTO',
                severidade: 3,
                nivel: 'erro',
                relPath: '[execução global]',
                arquivo: '[execução global]',
                linha: 0,
                mensagem: `Contexto de execução ou arquivos não disponíveis para o ${analistaPadroesUso.nome}.`,
                origem: analistaPadroesUso.nome
            });
            return ocorrencias;
        }
        // Itera sobre todos os arquivos que já foram escaneados e parseados
        for (const entry of contexto.arquivos) {
            // Ignora arquivos que não puderam ser parseados para AST
            if (!entry.ast)
                continue;
            // Realiza a travessia da AST para coletar as estatísticas
            traverse(entry.ast, {
                CallExpression(path) {
                    const callee = path.node.callee;
                    const arg = path.node.arguments[0];
                    if (t.isIdentifier(callee, { name: 'require' }) && arg && t.isStringLiteral(arg)) {
                        incrementar(estatisticasUsoGlobal.requires, arg.value);
                    }
                },
                VariableDeclaration(path) {
                    if (path.node.kind === 'const') {
                        for (const decl of path.node.declarations) {
                            if (t.isIdentifier(decl.id)) {
                                incrementar(estatisticasUsoGlobal.consts, decl.id.name);
                            }
                        }
                    }
                },
                ExportNamedDeclaration(path) {
                    const decl = path.node.declaration;
                    // Se for uma declaração de variável exportada (ex: export const meuVar = ...)
                    if (decl && t.isVariableDeclaration(decl)) {
                        for (const varDecl of decl.declarations) {
                            if (t.isIdentifier(varDecl.id)) {
                                incrementar(estatisticasUsoGlobal.exports, varDecl.id.name);
                            }
                        }
                    }
                    // Se for um especificador de exportação (ex: export { meuVar } ou export { meuVar as outroNome })
                    for (const spec of path.node.specifiers) {
                        if (t.isExportSpecifier(spec)) {
                            if (t.isIdentifier(spec.exported)) {
                                incrementar(estatisticasUsoGlobal.exports, spec.exported.name);
                            }
                            else if (t.isStringLiteral(spec.exported)) {
                                // Isso pode ocorrer em re-exports com string literais, embora menos comum
                                incrementar(estatisticasUsoGlobal.exports, spec.exported.value);
                            }
                        }
                    }
                }
            });
        }
        // No final, esta técnica global retorna uma única ocorrência
        // que encapsula todas as estatísticas coletadas.
        ocorrencias.push({
            tipo: 'ESTATISTICAS_USO_CODIGO',
            codigo: 'ESTATISTICAS_USO_CODIGO',
            severidade: 0, // Informativo
            nivel: 'info',
            relPath: '[global]',
            arquivo: '[global]',
            linha: 0,
            mensagem: 'Estatísticas globais de uso de código coletadas.',
            origem: analistaPadroesUso.nome,
            detalhes: estatisticasUsoGlobal // Inclui as estatísticas detalhadas aqui
        });
        return ocorrencias;
    }
};
