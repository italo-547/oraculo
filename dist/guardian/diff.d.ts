export interface SnapshotDiff {
  removidos: string[];
  adicionados: string[];
  alterados: string[];
}
/**
 * Compara dois snapshots de integridade (hash por arquivo) e retorna as diferenças encontradas.
 */
export declare function diffSnapshots(
  before: Record<string, string>,
  after: Record<string, string>,
): SnapshotDiff;
/**
 * Gera mensagens de erro de integridade com base nas permissões configuradas.
 */
export declare function verificarErros(diffs: SnapshotDiff): string[];
//# sourceMappingURL=diff.d.ts.map
