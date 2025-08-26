// SPDX-License-Identifier: MIT
import traverseModule from '@babel/traverse';

/**
 * Wrapper resiliente para o `@babel/traverse` lidando com variações de ESM/CJS.
 * Algumas builds expõem a função no `default`, outras como export do módulo CJS.
 */
type TraverseFn = (...a: unknown[]) => unknown;

let _traverseModule: unknown = traverseModule;

// Setter usado apenas em testes para injetar variações do módulo
export function __setTraverseModule(modulo: unknown) {
  _traverseModule = modulo;
}

export function traverse(...args: unknown[]): unknown {
  const mod = _traverseModule as unknown;
  let fn: TraverseFn | undefined;
  if (typeof mod === 'function') {
    fn = mod as TraverseFn;
  } else if (mod && typeof (mod as { default?: unknown }).default === 'function') {
    fn = (mod as { default: unknown }).default as TraverseFn;
  } else if (mod && typeof (mod as { traverse?: unknown }).traverse === 'function') {
    fn = (mod as { traverse: unknown }).traverse as TraverseFn;
  }
  if (!fn) {
    throw new TypeError('Babel traverse não é uma função — verifique a resolução de módulo.');
  }
  return fn(...args);
}
