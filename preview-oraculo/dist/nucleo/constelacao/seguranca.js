// SPDX-License-Identifier: MIT
import path from 'node:path';
// Normaliza um caminho relativo eliminando tentativas de escape (..), barras duplicadas e separadores inconsistentes
export function sanitizarRelPath(rel) {
    if (!rel)
        return '';
    rel = rel.replace(/^[A-Za-z]:\\?/u, '').replace(/^\/+/, '');
    const norm = rel.replace(/\\+/g, '/');
    const collapsed = path.posix.normalize(norm);
    if (collapsed.startsWith('..')) {
        // remove todos os prefixos de ../ e barras iniciais resultantes
        const semDots = collapsed.replace(/^(\.\/?)+/, '');
        return semDots.replace(/^\/+/, '');
    }
    return collapsed.replace(/^\/+/, '');
}
export function estaDentro(baseDir, alvo) {
    const rel = path.relative(baseDir, alvo);
    return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}
export function resolverPluginSeguro(baseDir, pluginRel) {
    try {
        if (typeof pluginRel !== 'string' || !pluginRel.trim()) {
            return { erro: 'entrada de plugin inválida (string vazia)' };
        }
        const resolvido = path.resolve(baseDir, pluginRel);
        if (!estaDentro(baseDir, resolvido)) {
            return { erro: 'plugin fora da raiz do projeto (bloqueado)' };
        }
        // Restringe extensões para reduzir risco de execução arbitrária
        const permitido = [/\.(c|m)?js$/i, /\.ts$/i];
        if (!permitido.some((r) => r.test(resolvido))) {
            return { erro: 'extensão de plugin não permitida' };
        }
        return { caminho: resolvido };
    }
    catch (e) {
        return { erro: e.message || String(e) };
    }
}
export function validarGlobBasico(padrao) {
    if (padrao.length > 300)
        return false;
    // Bloqueia mais de 4 ocorrências de '**' mesmo não consecutivas
    const ocorrencias = (padrao.match(/\*\*/g) || []).length;
    if (ocorrencias >= 5)
        return false;
    return true;
}
export function filtrarGlobSeguros(padroes) {
    return padroes.filter((p) => validarGlobBasico(p));
}
//# sourceMappingURL=seguranca.js.map