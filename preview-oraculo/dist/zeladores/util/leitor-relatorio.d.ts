/**
 * Utilitários para trabalhar com relatórios JSON versionados
 */
export interface LeitorRelatorioOptions {
    /** Caminho do arquivo do relatório */
    caminho: string;
    /** Se deve validar o schema (padrão: true) */
    validar?: boolean;
    /** Se deve migrar para versão atual se necessário (padrão: true) */
    migrar?: boolean;
}
/**
 * Lê um relatório JSON versionado do disco
 */
export declare function lerRelatorioVersionado<T = unknown>(options: LeitorRelatorioOptions): Promise<{
    sucesso: boolean;
    dados?: T;
    schema?: Record<string, unknown>;
    erro?: string;
    migrado?: boolean;
}>;
/**
 * Lê apenas os dados de um relatório, ignorando metadados de versão
 */
export declare function lerDadosRelatorio<T = unknown>(caminho: string): Promise<{
    sucesso: boolean;
    dados?: T;
    erro?: string;
}>;
/**
 * Verifica se um relatório tem schema válido
 */
export declare function verificarSchemaRelatorio(caminho: string): Promise<{
    valido: boolean;
    versao?: string;
    erros?: string[];
    erro?: string;
}>;
//# sourceMappingURL=leitor-relatorio.d.ts.map