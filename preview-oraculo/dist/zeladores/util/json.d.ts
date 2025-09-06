/**
 * Utilidades de JSON: escape Unicode e stringificação segura para consumidores legados.
 *
 * Regras:
 * - Converte qualquer caractere fora do ASCII básico em sequências \uXXXX.
 * - Para caracteres fora do BMP, emite pares substitutos (dois \uXXXX).
 * - Mantém caracteres ASCII intactos.
 */
/**
 * Escapa caracteres não-ASCII para sequências \uXXXX, incluindo pares substitutos.
 */
export declare function escapeNonAscii(s: string): string;
/**
 * Stringifica um objeto em JSON aplicando escapeNonAscii em todos os strings do objeto.
 * Normaliza possíveis double-escapes ("\\uXXXX" -> "\uXXXX").
 */
export declare function stringifyJsonEscaped(value: unknown, space?: number): string;
//# sourceMappingURL=json.d.ts.map