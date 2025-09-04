// SPDX-License-Identifier: MIT
import path from 'node:path';
/** Normaliza um caminho assegurando que permanece dentro da CWD (remove tentativas de escape). */
export function normalizarPathLocal(p) {
    const base = process.cwd();
    const abs = path.isAbsolute(p) ? p : path.join(base, p);
    const norm = path.normalize(abs);
    if (!norm.startsWith(base))
        return base; // impede escape
    return norm;
}
export function validarNumeroPositivo(v, nome) {
    if (v === undefined || v === null || v === '')
        return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0)
        throw new Error(`Valor inválido para ${nome}: ${v}`);
    return n;
}
/** Regras simples de combinação de flags globais. Expandir conforme novos casos. */
export function validarCombinacoes(flags) {
    const erros = [];
    if (flags.scanOnly && flags.incremental) {
        erros.push({
            codigo: 'SCAN_INCREMENTAL',
            mensagem: 'Não combinar --scan-only com --incremental (incremental exige AST).',
        });
    }
    return erros;
}
export function sanitizarFlags(flags) {
    const erros = validarCombinacoes(flags);
    if (erros.length) {
        const detalhe = erros.map((e) => `${e.codigo}: ${e.mensagem}`).join('; ');
        throw new Error(detalhe);
    }
}
//# sourceMappingURL=validacao.js.map