// SPDX-License-Identifier: MIT
// Wrapper para uso seguro de chalk em ESM/CJS e ambientes de bundling/SSR
// Objetivos:
// - Fornecer API estável com funções obrigatórias (não opcionais) para evitar 'possibly undefined'.
// - Suportar encadeamento básico usado no projeto (ex.: chalk.cyan.bold(...)).
// - Em ambientes sem chalk, aplicar fallback de identidade (retorna a string sem cor/estilo).

import chalkDefault, * as chalkNs from 'chalk';

// Estilos suportados pelo projeto
type StyleName = 'cyan' | 'green' | 'red' | 'yellow' | 'magenta' | 'bold' | 'gray' | 'dim';

// Função de estilo com encadeamento mínimo (apenas .bold após cores, conforme uso no código)
export interface StyleFn {
  (s: string): string;
  cyan?: StyleFn;
  green?: StyleFn;
  red?: StyleFn;
  yellow?: StyleFn;
  magenta?: StyleFn;
  bold?: StyleFn;
  gray?: StyleFn;
  dim?: StyleFn;
}

export interface ChalkLike {
  cyan: StyleFn;
  green: StyleFn;
  red: StyleFn;
  yellow: StyleFn;
  magenta: StyleFn;
  bold: StyleFn;
  gray: StyleFn;
  dim: StyleFn;
}

const ID = (s: string) => String(s);

function getSourceFns(x: unknown): Partial<Record<StyleName, (s: string) => string>> {
  if (!x) return {};
  const src = x as Record<string, unknown>;
  const pick = (k: StyleName): ((s: string) => string) | undefined => {
    const v = src[k as string];
    return typeof v === 'function' ? (v as (s: string) => string) : undefined;
  };
  return {
    cyan: pick('cyan'),
    green: pick('green'),
    red: pick('red'),
    yellow: pick('yellow'),
    magenta: pick('magenta'),
    bold: pick('bold'),
    gray: pick('gray'),
    dim: pick('dim'),
  };
}

function makeChalkLike(src: Partial<Record<StyleName, (s: string) => string>>): ChalkLike {
  const base = {
    cyan: src.cyan ?? ID,
    green: src.green ?? ID,
    red: src.red ?? ID,
    yellow: src.yellow ?? ID,
    magenta: src.magenta ?? ID,
    bold: src.bold ?? ID,
    gray: src.gray ?? ID,
    dim: src.dim ?? ID,
  } as const;

  const attachBoldChain = (colorFn: (s: string) => string): StyleFn => {
    const fn = ((s: string) => colorFn(String(s))) as StyleFn;
    // suporte a encadeamento como chalk.cyan.bold(...)
    fn.bold = ((s: string) => colorFn(base.bold(String(s)))) as StyleFn;
    return fn;
  };

  const cyan = attachBoldChain(base.cyan);
  const green = attachBoldChain(base.green);
  const red = attachBoldChain(base.red);
  const yellow = attachBoldChain(base.yellow);
  const magenta = attachBoldChain(base.magenta);
  const gray = attachBoldChain(base.gray);
  const dim = ((s: string) => base.dim(String(s))) as StyleFn; // dim sem encadeamento usado

  // bold em si (sem necessidade de cor encadeada no projeto)
  const bold = ((s: string) => base.bold(String(s))) as StyleFn;
  // Opcional: permitir bold.cyan(...), caso apareça futuramente
  bold.cyan = ((s: string) => base.cyan(base.bold(String(s)))) as StyleFn;
  bold.green = ((s: string) => base.green(base.bold(String(s)))) as StyleFn;
  bold.red = ((s: string) => base.red(base.bold(String(s)))) as StyleFn;
  bold.yellow = ((s: string) => base.yellow(base.bold(String(s)))) as StyleFn;
  bold.magenta = ((s: string) => base.magenta(base.bold(String(s)))) as StyleFn;
  bold.gray = ((s: string) => base.gray(base.bold(String(s)))) as StyleFn;
  bold.dim = ((s: string) => base.dim(base.bold(String(s)))) as StyleFn;

  return { cyan, green, red, yellow, magenta, bold, gray, dim };
}

// Preferimos a instância default; se não existir, usamos o namespace (CJS)
const resolvedUnknown: unknown =
  (chalkDefault as unknown) ?? (chalkNs as unknown as { default?: unknown }).default ?? chalkNs;

export const chalk: ChalkLike = makeChalkLike(getSourceFns(resolvedUnknown));
export default chalk;
