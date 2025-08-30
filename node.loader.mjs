// SPDX-License-Identifier: MIT
// Node.js ESM Loader para resolver aliases do Oráculo
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const aliasMap = {
  '@nucleo/': './dist/nucleo/',
  '@analistas/': './dist/analistas/',
  '@arquitetos/': './dist/arquitetos/',
  '@zeladores/': './dist/zeladores/',
  '@relatorios/': './dist/relatorios/',
  '@guardian/': './dist/guardian/',
  '@tipos/': './dist/tipos/',
  '@/': './dist/',
};

export async function resolve(specifier, context, defaultResolve) {
  // Só resolver aliases específicos do projeto Oráculo
  const projectPrefixes = ['@nucleo/', '@analistas/', '@arquitetos/', '@zeladores/', '@relatorios/', '@guardian/', '@tipos/', '@/'];
  const isProjectAlias = projectPrefixes.some(prefix => specifier.startsWith(prefix));
  
  if (isProjectAlias) {
    // Resolver aliases usando caminhos absolutos baseados no cwd
    for (const [alias, relPath] of Object.entries(aliasMap)) {
      if (specifier.startsWith(alias)) {
        const relativePath = specifier.replace(alias, relPath);

        // Basear resolução no diretório deste loader (normalmente a raiz do repo),
        // não no process.cwd() que nos testes aponta para um temp dir.
        const loaderDir = path.dirname(fileURLToPath(import.meta.url));
        const absolutePath = path.resolve(loaderDir, relativePath);

        // Garantir que seja uma URL válida
        const url = pathToFileURL(absolutePath).href;

        return {
          url,
          shortCircuit: true,
        };
      }
    }
  }

  // Usar resolução padrão para outros módulos (incluindo pacotes npm)
  return defaultResolve(specifier, context);
}

export async function load(url, context, defaultLoad) {
  // Usar carregamento padrão
  return defaultLoad(url, context);
}
