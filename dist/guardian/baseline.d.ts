/**
 * Representa o estado salvo de integridade de arquivos no baseline.
 * Mapeia caminho relativo de arquivo para hash (string).
 */
export type SnapshotBaseline = Record<string, string>;
/**
 * Lê o baseline atual do sistema de integridade.
 * Retorna null se o arquivo não existir ou estiver malformado.
 */
export declare function carregarBaseline(): Promise<SnapshotBaseline | null>;
/**
 * Salva um novo baseline de integridade em disco, sobrescrevendo qualquer estado anterior.
 */
export declare function salvarBaseline(snapshot: SnapshotBaseline): Promise<void>;
//# sourceMappingURL=baseline.d.ts.map