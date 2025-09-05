// SPDX-License-Identifier: MIT
// Node.js ESM Loader para resolver aliases do Oráculo
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

// Base dinâmica: se o loader estiver em dist/, usar dist como base; senão, usar <raiz>/dist
const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const distBase = path.basename(loaderDir) === 'dist' ? loaderDir : path.resolve(loaderDir, 'dist');

const aliasMap = {
  '@nucleo/': 'nucleo/',
  '@cli/': 'cli/',
  '@analistas/': 'analistas/',
  '@arquitetos/': 'arquitetos/',
  '@zeladores/': 'zeladores/',
  '@relatorios/': 'relatorios/',
  '@guardian/': 'guardian/',
  '@tipos/': 'tipos/',
  '@/': '',
};

export async function resolve(specifier, context, defaultResolve) {
  // Só resolver aliases específicos do projeto Oráculo
  const projectPrefixes = ['@nucleo/', '@cli/', '@analistas/', '@arquitetos/', '@zeladores/', '@relatorios/', '@guardian/', '@tipos/', '@/'];
  const isProjectAlias = projectPrefixes.some(prefix => specifier.startsWith(prefix));
  
  if (isProjectAlias) {
    // Resolver aliases usando caminhos absolutos baseados no cwd
    for (const [alias, relPath] of Object.entries(aliasMap)) {
      if (specifier.startsWith(alias)) {
        const relativePath = specifier.replace(alias, relPath);
        const absolutePath = path.resolve(distBase, relativePath);

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
