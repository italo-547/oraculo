export interface MovimentoEstrutural {
  de: string;
  para: string;
}
export declare function gerarRelatorioReestruturarMarkdown(
  caminho: string,
  movimentos: MovimentoEstrutural[],
  opcoes?: {
    simulado?: boolean;
    origem?: string;
    preset?: string;
    conflitos?: number;
  },
): Promise<void>;
export declare function gerarRelatorioReestruturarJson(
  caminho: string,
  movimentos: MovimentoEstrutural[],
  opcoes?: {
    simulado?: boolean;
    origem?: string;
    preset?: string;
    conflitos?: number;
  },
): Promise<void>;
//# sourceMappingURL=relatorio-reestruturar.d.ts.map
