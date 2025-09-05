// SPDX-License-Identifier: MIT
// Helpers utilitários para analistas
/**
 * Incrementa um contador de ocorrências por chave.
 */
export function incrementar(contador, chave) {
    contador[chave] = (contador[chave] ?? 0) + 1;
}
/**
 * Garante que sempre retorna array vazio se valor for null/undefined.
 */
export function garantirArray(valor) {
    return Array.isArray(valor) ? valor : [];
}
//# sourceMappingURL=helpers-analistas.js.map