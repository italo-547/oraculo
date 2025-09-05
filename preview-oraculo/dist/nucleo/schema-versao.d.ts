/**
 * Sistema de Versionamento de Schema para Relatórios JSON
 *
 * Este módulo gerencia versões de schema para relatórios JSON do Oráculo,
 * garantindo compatibilidade futura e evolução controlada dos formatos.
 */
export interface SchemaMetadata {
    /** Versão do schema (ex: "1.0.0") */
    versao: string;
    /** Data de criação do schema */
    criadoEm: string;
    /** Descrição das mudanças nesta versão */
    descricao: string;
    /** Versões compatíveis para leitura (backward compatibility) */
    compatibilidade: string[];
    /** Campos obrigatórios nesta versão */
    camposObrigatorios: string[];
    /** Campos opcionais nesta versão */
    camposOpcionais: string[];
}
export interface RelatorioComVersao<T = unknown> {
    /** Metadados de versão do schema */
    _schema: SchemaMetadata;
    /** Dados do relatório */
    dados: T;
}
/** Versão atual do schema */
export declare const VERSAO_ATUAL = "1.0.0";
/** Histórico de versões do schema */
export declare const HISTORICO_VERSOES: Record<string, SchemaMetadata>;
/**
 * Cria metadados de schema para a versão atual
 */
export declare function criarSchemaMetadata(versao?: string, descricaoPersonalizada?: string): SchemaMetadata;
/**
 * Valida se um relatório tem schema válido
 */
export declare function validarSchema(relatorio: Record<string, unknown>): {
    valido: boolean;
    erros: string[];
};
/**
 * Migra um relatório para a versão atual se necessário
 */
export declare function migrarParaVersaoAtual<T>(relatorio: Record<string, unknown>): RelatorioComVersao<T>;
/**
 * Cria um relatório com versão atual
 */
export declare function criarRelatorioComVersao<T>(dados: T, versao?: string, descricao?: string): RelatorioComVersao<T>;
/**
 * Extrai apenas os dados de um relatório versionado
 */
export declare function extrairDados<T>(relatorio: RelatorioComVersao<T>): T;
/**
 * Verifica se uma versão é compatível com a atual
 */
export declare function versaoCompativel(versao: string): boolean;
//# sourceMappingURL=schema-versao.d.ts.map