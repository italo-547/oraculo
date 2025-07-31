/**
 * Representa o alinhamento ideal e real de um arquivo.
 */
export interface AlinhamentoItem {
    arquivo: string;
    atual: string;
    ideal: string;
}
/**
 * Gera um relatório em Markdown sobre a estrutura de diretórios.
 */
export declare function gerarRelatorioEstrutura(mapa: AlinhamentoItem[]): string;
//# sourceMappingURL=relatorio-estrutura.d.ts.map