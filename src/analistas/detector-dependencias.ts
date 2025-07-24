import { traverse } from '../nucleo/constelacao/traverse';
import path from 'node:path';
export const grafoDependencias = new Map();
function extrairReferencias(ast) {
    const refs = [];
    traverse(ast, {
        ImportDeclaration(path) {
            refs.push(path.node.source.value);
        },
        CallExpression(path) {
            const { callee, arguments: args } = path.node;
            if (callee.type === 'Identifier' &&
                callee.name === 'require' &&
                args[0]?.type === 'StringLiteral') {
                refs.push(args[0].value);
            }
        },
        ExportAllDeclaration(path) {
            if (path.node.source?.value)
                refs.push(path.node.source.value);
        },
        ExportNamedDeclaration(path) {
            if (path.node.source?.value)
                refs.push(path.node.source.value);
        }
    });
    return refs;
}
function tentarComExtensoes(caminhoBase, extPossiveis, arquivosValidos) {
    for (const ext of extPossiveis) {
        const tentativa = `${caminhoBase}${ext}`;
        if (!arquivosValidos || arquivosValidos.has(tentativa))
            return tentativa;
    }
    const baseIndex = path.join(caminhoBase, 'index');
    for (const ext of extPossiveis) {
        const tentativa = `${baseIndex}${ext}`;
        if (!arquivosValidos || arquivosValidos.has(tentativa))
            return tentativa;
    }
    return null;
}
function resolverReferencia(baseRelPath, ref, arquivosValidos) {
    if (!ref.startsWith('.') && !ref.startsWith('/'))
        return null;
    const origem = path.dirname(baseRelPath);
    const base = path.normalize(path.join(origem, ref));
    if (!arquivosValidos)
        return base;
    if (arquivosValidos.has(base))
        return base;
    const EXTENSOES_TENTADAS = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    return tentarComExtensoes(base, EXTENSOES_TENTADAS, arquivosValidos);
}
export const detectorDependencias = {
    nome: 'detectordependencias',
    aplicar(src, relPath, ast, fullPath, contexto) {
        if (!ast)
            return [];
        const arquivosValidosSet = contexto?.ambiente?.arquivosValidosSet;
        const refs = extrairReferencias(ast);
        const resolvidas = refs
            .map(ref => resolverReferencia(relPath, ref, arquivosValidosSet))
            .filter(Boolean);
        const existentes = grafoDependencias.get(relPath) ?? new Set();
        for (const ref of resolvidas)
            existentes.add(ref);
        grafoDependencias.set(relPath, existentes);
        return resolvidas.map(destino => ({
            tipo: 'dependencia',
            mensagem: `Importa ou exporta módulo: ${destino}`,
            arquivo: relPath,
            origem: detectorDependencias.nome,
            nivel: 'info',
            relPath,
            linha: 1
        }));
    }
};
