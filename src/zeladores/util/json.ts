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
export function escapeNonAscii(s: string): string {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === null || cp <= 0x7f) {
      out += ch;
    } else if (cp <= 0xffff) {
      out += '\\u' + cp.toString(16).padStart(4, '0');
    } else {
      // caracteres fora do BMP -> pares substitutos
      const v = cp - 0x10000;
      const high = 0xd800 + (v >> 10);
      const low = 0xdc00 + (v & 0x3ff);
      out += '\\u' + high.toString(16).padStart(4, '0');
      out += '\\u' + low.toString(16).padStart(4, '0');
    }
  }
  return out;
}

/**
 * Stringifica um objeto em JSON aplicando escapeNonAscii em todos os strings do objeto.
 * Normaliza possíveis double-escapes ("\\uXXXX" -> "\uXXXX").
 */
export function stringifyJsonEscaped(value: unknown, space: number = 2): string {
  const replacer = (_key: string, v: unknown) => (typeof v === 'string' ? escapeNonAscii(v) : v);
  const raw = JSON.stringify(value, replacer, space);
  // JSON.stringify pode escapar as barras invertidas inseridas pelo replacer
  // (\\u -> \u). Normalizamos para os consumidores que esperam \uXXXX.
  return raw.replace(/\\\\u/g, '\\u');
}
