/**
 * Utilitários para trabalhar com relatórios JSON versionados
 */
export interface LeitorRelatorioOptions {
<<<<<<< HEAD
    /** Caminho do arquivo do relatório */
    caminho: string;
    /** Se deve validar o schema (padrão: true) */
    validar?: boolean;
    /** Se deve migrar para versão atual se necessário (padrão: false) */
    migrar?: boolean;
=======
  /** Caminho do arquivo do relatório */
  caminho: string;
  /** Se deve validar o schema (padrão: true) */
  validar?: boolean;
  /** Se deve migrar para versão atual se necessário (padrão: false) */
  migrar?: boolean;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
/**
 * Lê um relatório JSON versionado do disco
 */
<<<<<<< HEAD
export declare function lerRelatorioVersionado<T = unknown>(options: LeitorRelatorioOptions): Promise<{
    sucesso: boolean;
    dados?: T;
    schema?: Record<string, unknown>;
    erro?: string;
    migrado?: boolean;
=======
export declare function lerRelatorioVersionado<T = unknown>(
  options: LeitorRelatorioOptions,
): Promise<{
  sucesso: boolean;
  dados?: T;
  schema?: Record<string, unknown>;
  erro?: string;
  migrado?: boolean;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}>;
/**
 * Lê apenas os dados de um relatório, ignorando metadados de versão
 */
<<<<<<< HEAD
export declare function lerDadosRelatorio<T = unknown>(caminho: string): Promise<{
    sucesso: boolean;
    dados?: T;
    erro?: string;
=======
export declare function lerDadosRelatorio<T = unknown>(
  caminho: string,
): Promise<{
  sucesso: boolean;
  dados?: T;
  erro?: string;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}>;
/**
 * Verifica se um relatório tem schema válido
 */
export declare function verificarSchemaRelatorio(caminho: string): Promise<{
<<<<<<< HEAD
    valido: boolean;
    versao?: string;
    erros?: string[];
    erro?: string;
}>;
//# sourceMappingURL=leitor-relatorio.d.ts.map
=======
  valido: boolean;
  versao?: string;
  erros?: string[];
  erro?: string;
}>;
//# sourceMappingURL=leitor-relatorio.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
