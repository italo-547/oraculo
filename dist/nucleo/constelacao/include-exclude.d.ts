/**
 * Helper centralizado para lógica de include/exclude dinâmica por diretório/padrão.
 * Permite ativar/desativar regras, aplicar toggles e customizações programáticas.
 */
import type { Dirent } from 'node:fs';
import type { IncludeExcludeConfig } from '@tipos/tipos.js';
/**
 * Avalia se um caminho deve ser incluído/excluído conforme config dinâmica.
 * - Aplica regras globais e específicas por diretório.
 * - Permite toggles programáticos.
 */
<<<<<<< HEAD
export declare function shouldInclude(relPath: string, entry: Dirent, config: IncludeExcludeConfig): boolean;
//# sourceMappingURL=include-exclude.d.ts.map
=======
export declare function shouldInclude(
  relPath: string,
  entry: Dirent,
  config: IncludeExcludeConfig,
): boolean;
//# sourceMappingURL=include-exclude.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
