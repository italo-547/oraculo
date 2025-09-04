// SPDX-License-Identifier: MIT
// Wrapper para uso seguro de chalk em ESM/CJS e ambientes de bundling/SSR
// Objetivos:
// - Fornecer API estável com funções obrigatórias (não opcionais) para evitar 'possibly undefined'.
// - Suportar encadeamento básico usado no projeto (ex.: chalk.cyan.bold(...)).
// - Em ambientes sem chalk, aplicar fallback de identidade (retorna a string sem cor/estilo).
import chalkDefault, * as chalkNs from 'chalk';
const ID = (s) => String(s);
function getSourceFns(x) {
    if (!x)
        return {};
    const src = x;
    const pick = (k) => {
        const v = src[k];
        return typeof v === 'function' ? v : undefined;
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
function makeChalkLike(src) {
    const base = {
        cyan: src.cyan ?? ID,
        green: src.green ?? ID,
        red: src.red ?? ID,
        yellow: src.yellow ?? ID,
        magenta: src.magenta ?? ID,
        bold: src.bold ?? ID,
        gray: src.gray ?? ID,
        dim: src.dim ?? ID,
    };
    const attachBoldChain = (colorFn) => {
        const fn = ((s) => colorFn(String(s)));
        // suporte a encadeamento como chalk.cyan.bold(...)
        fn.bold = ((s) => colorFn(base.bold(String(s))));
        return fn;
    };
    const cyan = attachBoldChain(base.cyan);
    const green = attachBoldChain(base.green);
    const red = attachBoldChain(base.red);
    const yellow = attachBoldChain(base.yellow);
    const magenta = attachBoldChain(base.magenta);
    const gray = attachBoldChain(base.gray);
    const dim = ((s) => base.dim(String(s))); // dim sem encadeamento usado
    // bold em si (sem necessidade de cor encadeada no projeto)
    const bold = ((s) => base.bold(String(s)));
    // Opcional: permitir bold.cyan(...), caso apareça futuramente
    bold.cyan = ((s) => base.cyan(base.bold(String(s))));
    bold.green = ((s) => base.green(base.bold(String(s))));
    bold.red = ((s) => base.red(base.bold(String(s))));
    bold.yellow = ((s) => base.yellow(base.bold(String(s))));
    bold.magenta = ((s) => base.magenta(base.bold(String(s))));
    bold.gray = ((s) => base.gray(base.bold(String(s))));
    bold.dim = ((s) => base.dim(base.bold(String(s))));
    return { cyan, green, red, yellow, magenta, bold, gray, dim };
}
// Preferimos a instância default; se não existir, usamos o namespace (CJS)
const resolvedUnknown = chalkDefault ?? chalkNs.default ?? chalkNs;
export const chalk = makeChalkLike(getSourceFns(resolvedUnknown));
export default chalk;
//# sourceMappingURL=chalk-safe.js.map