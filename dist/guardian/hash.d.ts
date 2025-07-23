/**
 * Gera um hash hexadecimal a partir do conteúdo fornecido.
 */
export declare function gerarHashHex(conteudo: any): string;
/**
 * Gera um snapshot do conteúdo incluindo:
 * - Hash de integridade
 * - Número de linhas
 * - Amostra textual do início do arquivo
 */
export declare function gerarSnapshotDoConteudo(conteudo: any): {
    hash: string;
    linhas: any;
    amostra: any;
};
//# sourceMappingURL=hash.d.ts.map