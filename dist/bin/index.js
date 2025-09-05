#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Bootstrap do binário: registra o loader ESM programaticamente e importa ./cli.js
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const distRoot = path.resolve(path.dirname(process.argv[1]), '..');
const loaderPath = path.resolve(distRoot, 'node.loader.mjs');
const loaderUrl = pathToFileURL(loaderPath).toString();
const entryPath = path.resolve(distRoot, 'bin', 'cli.js');
const entryUrl = pathToFileURL(entryPath).toString();
// Registra o loader sem usar --experimental-loader (evita ExperimentalWarning)
void (async () => {
    try {
        const { register } = await import('node:module');
        register(loaderUrl, pathToFileURL('./'));
        await import(entryUrl);
    }
    catch (err) {
        console.error('Erro ao inicializar o oraculo:', err?.message || err);
        process.exit(1);
    }
})();
//# sourceMappingURL=index.js.map