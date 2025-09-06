// SPDX-License-Identifier: MIT
import { config } from '@nucleo/constelacao/cosmos.js';
/**
 * Compara dois snapshots de integridade (hash por arquivo) e retorna as diferenças encontradas.
 */
export function diffSnapshots(before, after) {
    // Cache intra-processo para evitar recomputar diffs idênticos em execuções repetidas
    const key = `${Object.keys(before).length}:${Object.keys(after).length}`;
    const hashBefore = config.GUARDIAN_ENFORCE_PROTECTION ? Object.values(before).join('|') : '';
    const hashAfter = config.GUARDIAN_ENFORCE_PROTECTION ? Object.values(after).join('|') : '';
    const cacheKey = key + ':' + hashBefore + '>' + hashAfter;
    const globalAny = global;
    if (!globalAny.__ORACULO_DIFF_CACHE__)
        globalAny.__ORACULO_DIFF_CACHE__ = new Map();
    const cache = globalAny.__ORACULO_DIFF_CACHE__;
    if (cache.has(cacheKey)) {
        const globAny = globalAny;
        globAny.__ORACULO_DIFF_CACHE_HITS__ = (globAny.__ORACULO_DIFF_CACHE_HITS__ || 0) + 1;
        const hit = cache.get(cacheKey);
        if (hit)
            return hit;
    }
    const removidos = Object.keys(before).filter((key) => !(key in after));
    const adicionados = Object.keys(after).filter((key) => !(key in before));
    const alterados = Object.keys(before).filter((key) => key in after && before[key] !== after[key]);
    const resultado = { removidos, adicionados, alterados };
    cache.set(cacheKey, resultado);
    return resultado;
}
/**
 * Gera mensagens de erro de integridade com base nas permissões configuradas.
 */
export function verificarErros(diffs) {
    const erros = [];
    if (diffs.removidos.length > 0 && !config.GUARDIAN_ALLOW_DELS) {
        erros.push(`🗑️ Arquivos removidos: ${diffs.removidos.join(', ')}`);
    }
    if (diffs.adicionados.length > 0 && !config.GUARDIAN_ALLOW_ADDS) {
        erros.push(`📁 Arquivos adicionados: ${diffs.adicionados.join(', ')}`);
    }
    if (diffs.alterados.length > 0 && !config.GUARDIAN_ALLOW_CHG) {
        erros.push(`✏️ Arquivos alterados: ${diffs.alterados.join(', ')}`);
    }
    return erros;
}
//# sourceMappingURL=diff.js.map