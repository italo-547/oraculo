// SPDX-License-Identifier: MIT
import path from 'node:path';
import { traverse } from '@nucleo/constelacao/traverse.js';
export const grafoDependencias = new Map();
/**
 * Normaliza o caminho de import para uma chave consistente.
 */
function normalizarModulo(mod, relPath) {
    if (mod.startsWith('.')) {
        const resolved = path.normalize(path.join(path.dirname(relPath), mod)).replace(/\\/g, '/');
        return resolved;
    }
    return mod;
}
/**
 * Analisa dependências do arquivo (import/require), detecta padrões problemáticos e atualiza grafo global.
 * Retorna ocorrências para imports/require suspeitos, mistos, circulares, etc.
 */
export const detectorDependencias = {
    nome: 'detector-dependencias',
    test(relPath) {
        return relPath.endsWith('.ts') || relPath.endsWith('.js');
    },
    aplicar(src, relPath, ast, _fullPath, contexto) {
        if (!ast)
            return [];
        const ocorrencias = [];
        const tiposImport = new Set();
        const arquivosExistentes = contexto
            ? new Set(contexto.arquivos.map((f) => f.relPath))
            : undefined;
        // Conjunto de dependências (criado sob demanda quando houver refs)
        let depsSet = grafoDependencias.get(relPath);
        // Detecta padrões problemáticos
        traverse(ast.node, {
            ImportDeclaration(p) {
                tiposImport.add('import');
                const val = p.node.source.value;
                // Alimenta grafo
                if (!depsSet) {
                    depsSet = new Set();
                    grafoDependencias.set(relPath, depsSet);
                }
                depsSet.add(normalizarModulo(val, relPath));
                // Import externo
                if (!val.startsWith('.') && !val.startsWith('/')) {
                    ocorrencias.push({
                        tipo: 'info',
                        mensagem: `Importação de dependência externa: '${val}'`,
                        arquivo: relPath,
                        linha: p.node.loc?.start.line,
                        coluna: p.node.loc?.start.column,
                    });
                }
                // Import relativo longo
                if (val.startsWith('.') && val.split('../').length > 3) {
                    ocorrencias.push({
                        tipo: 'aviso',
                        mensagem: `Import relativo sobe muitos diretórios: '${val}'`,
                        arquivo: relPath,
                        linha: p.node.loc?.start.line,
                        coluna: p.node.loc?.start.column,
                    });
                }
                // Import de .js em projeto TS
                if (relPath.endsWith('.ts') && val.endsWith('.js')) {
                    ocorrencias.push({
                        tipo: 'alerta',
                        mensagem: `Importação de arquivo .js em TypeScript: '${val}'`,
                        arquivo: relPath,
                        linha: p.node.loc?.start.line,
                        coluna: p.node.loc?.start.column,
                    });
                }
                // Import de arquivo inexistente (só para caminhos relativos)
                if (val.startsWith('.')) {
                    const importPath = path.join(path.dirname(relPath), val);
                    if (arquivosExistentes &&
                        !(arquivosExistentes.has(importPath) ||
                            arquivosExistentes.has(importPath + '.ts') ||
                            arquivosExistentes.has(importPath + '.js'))) {
                        ocorrencias.push({
                            tipo: 'erro',
                            mensagem: `Importação de arquivo inexistente: '${val}'`,
                            arquivo: relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                }
            },
            CallExpression(p) {
                const { callee, arguments: args } = p.node;
                if (callee.type === 'Identifier' &&
                    callee.name === 'require' &&
                    args[0]?.type === 'StringLiteral') {
                    tiposImport.add('require');
                    const val = args[0].value;
                    // Alimenta grafo
                    if (!depsSet) {
                        depsSet = new Set();
                        grafoDependencias.set(relPath, depsSet);
                    }
                    depsSet.add(normalizarModulo(val, relPath));
                    // Require externo
                    if (!val.startsWith('.') && !val.startsWith('/')) {
                        ocorrencias.push({
                            tipo: 'info',
                            mensagem: `Require de dependência externa: '${val}'`,
                            arquivo: relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                    // Require relativo longo
                    if (val.startsWith('.') && val.split('../').length > 3) {
                        ocorrencias.push({
                            tipo: 'aviso',
                            mensagem: `Require relativo sobe muitos diretórios: '${val}'`,
                            arquivo: relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                    // Require de .js em projeto TS
                    if (relPath.endsWith('.ts') && val.endsWith('.js')) {
                        ocorrencias.push({
                            tipo: 'alerta',
                            mensagem: `Require de arquivo .js em TypeScript: '${val}'`,
                            arquivo: relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                    // Require de arquivo inexistente (só para caminhos relativos)
                    if (val.startsWith('.')) {
                        const importPath = path.join(path.dirname(relPath), val);
                        if (arquivosExistentes &&
                            !(arquivosExistentes.has(importPath) ||
                                arquivosExistentes.has(importPath + '.ts') ||
                                arquivosExistentes.has(importPath + '.js'))) {
                            ocorrencias.push({
                                tipo: 'erro',
                                mensagem: `Require de arquivo inexistente: '${val}'`,
                                arquivo: relPath,
                                linha: p.node.loc?.start.line,
                                coluna: p.node.loc?.start.column,
                            });
                        }
                    }
                }
            },
        });
        // Mistura de require/import
        if (tiposImport.size > 1) {
            ocorrencias.push({
                tipo: 'aviso',
                mensagem: `Uso misto de require e import no mesmo arquivo. Padronize para um só estilo.`,
                arquivo: relPath,
            });
        }
        // Detecta import circular simples (arquivo importa a si mesmo)
        if (grafoDependencias.get(relPath)?.has(relPath)) {
            ocorrencias.push({
                tipo: 'alerta',
                mensagem: `Importação circular detectada: o arquivo importa a si mesmo.`,
                arquivo: relPath,
            });
        }
        return Array.isArray(ocorrencias) ? ocorrencias : [];
    },
};
//# sourceMappingURL=detector-dependencias.js.map