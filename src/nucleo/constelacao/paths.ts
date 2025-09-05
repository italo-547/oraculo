// SPDX-License-Identifier: MIT
// Centraliza padrões e utilidades de caminhos para evitar hardcodes dispersos

export const SRC_ROOT = 'src';
export const SRC_GLOB = 'src/**';

// Diretórios sempre tratados como meta (independente de SRC)
export const META_DIRS = ['.github', '.vscode', '.oraculo'];

// Normaliza para separador POSIX
export function toPosix(p: string): string {
  return String(p || '').replace(/\\+/g, '/');
}

// Caminho relativo (POSIX) está dentro de src?
export function isInsideSrc(relPath: string): boolean {
  const r = toPosix(relPath);
  // Considera qualquer segmento "src" em qualquer nível: (^|/)src(/|$)
  return /(?:^|\/)src(?:\/|$)/.test(r);
}

// Heurística de meta: tudo fora de src é meta, além dos diretórios explícitos
export function isMetaPath(relPath: string): boolean {
  const r = toPosix(relPath);
  if (META_DIRS.some((d) => r === d || r.startsWith(d + '/'))) return true;
  return !isInsideSrc(r);
}
