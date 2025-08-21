// SPDX-License-Identifier: MIT
/**
 * Helper centralizado para lógica de include/exclude dinâmica por diretório/padrão.
 * Permite ativar/desativar regras, aplicar toggles e customizações programáticas.
 */
import type { Dirent } from 'node:fs';
import type { IncludeExcludeConfig } from '../../tipos/tipos.js';

/**
 * Avalia se um caminho deve ser incluído/excluído conforme config dinâmica.
 * - Aplica regras globais e específicas por diretório.
 * - Permite toggles programáticos.
 */
export function shouldInclude(
  relPath: string,
  entry: Dirent,
  config: IncludeExcludeConfig,
): boolean {
  // Regras por diretório (match por prefixo)
  if (config.dirRules) {
    for (const dir in config.dirRules) {
      if (relPath.startsWith(dir)) {
        const rule = config.dirRules[dir];
        if (rule.exclude) return false;
        if (rule.include) return true;
        if (rule.patterns && rule.patterns.some((p: string) => relPath.includes(p))) return true;
        if (rule.custom && rule.custom(relPath, entry)) return true;
      }
    }
  }
  // Globais
  if (config.globalExclude && config.globalExclude.some((p: string) => relPath.includes(p))) {
    return false;
  }
  if (config.globalInclude && config.globalInclude.some((p: string) => relPath.includes(p))) {
    return true;
  }
  // Default: inclui se não excluído
  return true;
}
