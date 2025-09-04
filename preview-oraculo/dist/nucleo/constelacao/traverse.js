// SPDX-License-Identifier: MIT
import traverseModule from '@babel/traverse';
let _traverseModule = traverseModule;
// Setter usado apenas em testes para injetar variações do módulo
export function __setTraverseModule(modulo) {
    _traverseModule = modulo;
}
export function traverse(...args) {
    const mod = _traverseModule;
    let fn;
    if (typeof mod === 'function') {
        fn = mod;
    }
    else if (mod && typeof mod.default === 'function') {
        fn = mod.default;
    }
    else if (mod && typeof mod.traverse === 'function') {
        fn = mod.traverse;
    }
    if (!fn) {
        throw new TypeError('Babel traverse não é uma função — verifique a resolução de módulo.');
    }
    return fn(...args);
}
//# sourceMappingURL=traverse.js.map