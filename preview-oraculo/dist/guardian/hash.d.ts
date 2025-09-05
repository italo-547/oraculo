export interface SnapshotDetalhado {
  hash: string;
  linhas: number;
  amostra: string;
}
/**
 * Gera um hash hexadecimal a partir do conteúdo fornecido.
 */
export declare function gerarHashHex(conteudo: string): string;
/**
 * Gera um snapshot do conteúdo incluindo:
 * - Hash de integridade
 * - Número de linhas
 * - Amostra textual do início do arquivo
 */
export declare function gerarSnapshotDoConteudo(conteudo: string): string;
//# sourceMappingURL=hash.d.ts.map
