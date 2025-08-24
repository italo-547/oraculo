// SPDX-License-Identifier: MIT
// Wrapper para uso seguro de chalk em ESM/CJS e ambientes de bundling/SSR
import chalkDefault, * as chalkNs from 'chalk';

export type StyleFn = (s: string) => string;
export interface ChalkLike {
  cyan?: StyleFn;
  green?: StyleFn;
  red?: StyleFn;
  yellow?: StyleFn;
  magenta?: StyleFn;
  bold?: StyleFn;
  gray?: StyleFn;
}

function coerceChalk(x: unknown): ChalkLike {
  if (!x) return {};
  const src = x as Record<string, unknown>;
  const pick = (k: keyof ChalkLike): StyleFn | undefined => {
    const v = src[k as string];
    return typeof v === 'function' ? (v as StyleFn) : undefined;
  };
  return {
    cyan: pick('cyan'),
    green: pick('green'),
    red: pick('red'),
    yellow: pick('yellow'),
    magenta: pick('magenta'),
    bold: pick('bold'),
    gray: pick('gray'),
  };
}

// Preferimos a instância default; se não existir, usamos o namespace (CJS)
const resolvedUnknown: unknown =
  (chalkDefault as unknown) ?? (chalkNs as unknown as { default?: unknown }).default ?? chalkNs;

export const chalk: ChalkLike = coerceChalk(resolvedUnknown);
export default chalk;
