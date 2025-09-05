export interface SnapshotDiff {
<<<<<<< HEAD
    removidos: string[];
    adicionados: string[];
    alterados: string[];
=======
  removidos: string[];
  adicionados: string[];
  alterados: string[];
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
/**
 * Compara dois snapshots de integridade (hash por arquivo) e retorna as diferenças encontradas.
 */
<<<<<<< HEAD
export declare function diffSnapshots(before: Record<string, string>, after: Record<string, string>): SnapshotDiff;
=======
export declare function diffSnapshots(
  before: Record<string, string>,
  after: Record<string, string>,
): SnapshotDiff;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
/**
 * Gera mensagens de erro de integridade com base nas permissões configuradas.
 */
export declare function verificarErros(diffs: SnapshotDiff): string[];
<<<<<<< HEAD
//# sourceMappingURL=diff.d.ts.map
=======
//# sourceMappingURL=diff.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
