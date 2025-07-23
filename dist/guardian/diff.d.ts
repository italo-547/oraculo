/**
 * Compara dois snapshots de integridade e retorna as diferenças encontradas.
 * - Arquivos removidos
 * - Arquivos adicionados
 * - Arquivos alterados (mesmo nome, conteúdo diferente)
 */
export declare function diffSnapshots(before: any, after: any): {
    removidos: string[];
    adicionados: string[];
    alterados: string[];
};
/**
 * Gera mensagens de erro de integridade com base nas permissões configuradas.
 */
export declare function verificarErros(diffs: any): string[];
//# sourceMappingURL=diff.d.ts.map