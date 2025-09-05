export interface SnapshotDetalhado {
<<<<<<< HEAD
    hash: string;
    linhas: number;
    amostra: string;
=======
  hash: string;
  linhas: number;
  amostra: string;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
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
<<<<<<< HEAD
//# sourceMappingURL=hash.d.ts.map
=======
//# sourceMappingURL=hash.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
