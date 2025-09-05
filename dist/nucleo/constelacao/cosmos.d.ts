import type { IncludeExcludeConfig } from '@tipos/tipos.js';
export declare const configDefault: {
<<<<<<< HEAD
    VERBOSE: boolean;
    DEV_MODE: boolean;
    AUTOANALISE_CONCURRENCY: number;
    SAFE_MODE: boolean;
    ALLOW_PLUGINS: boolean;
    ALLOW_EXEC: boolean;
    ALLOW_MUTATE_FS: boolean;
    GUARDIAN_ENABLED: boolean;
    GUARDIAN_ENFORCE_PROTECTION: boolean;
    GUARDIAN_BASELINE: string;
    GUARDIAN_ALLOW_ADDS: boolean;
    GUARDIAN_ALLOW_CHG: boolean;
    GUARDIAN_ALLOW_DELS: boolean;
    GUARDIAN_IGNORE_PATTERNS: string[];
    REPORT_SILENCE_LOGS: boolean;
    SUPPRESS_PARCIAL_LOGS: boolean;
    REPORT_EXPORT_ENABLED: boolean;
    REPORT_OUTPUT_DIR: string;
    RELATORIO_SAUDE_TABELA_ENABLED: boolean;
    RELATORIO_SAUDE_DETALHADO_VERBOSE: boolean;
    ORACULO_STATE_DIR: string;
    ZELADOR_ABANDONED_DIR: string;
    ZELADOR_PENDING_PATH: string;
    ZELADOR_REACTIVATE_PATH: string;
    ZELADOR_HISTORY_PATH: string;
    ZELADOR_REPORT_PATH: string;
    ZELADOR_GHOST_INACTIVITY_DAYS: number;
    ZELADOR_IGNORE_PATTERNS: string[];
    CLI_INCLUDE_PATTERNS: string[];
    CLI_INCLUDE_GROUPS: string[][];
    CLI_EXCLUDE_PATTERNS: string[];
    INCLUDE_EXCLUDE_RULES: IncludeExcludeConfig;
    ZELADOR_LINE_THRESHOLD: number;
    SCANNER_EXTENSOES_COM_AST: string[];
    VIGIA_TOP_N: number;
    ANALISE_LIMITES: {
        FUNCOES_LONGAS: {
            MAX_LINHAS: number;
            MAX_PARAMETROS: number;
            MAX_ANINHAMENTO: number;
        };
    };
    ANALISE_AST_CACHE_ENABLED: boolean;
    ANALISE_METRICAS_ENABLED: boolean;
    ANALISE_TIMEOUT_POR_ANALISTA_MS: number;
    WORKER_POOL_ENABLED: boolean;
    WORKER_POOL_MAX_WORKERS: number;
    WORKER_POOL_BATCH_SIZE: number;
    ANALISE_METRICAS_HISTORICO_PATH: string;
    ANALISE_METRICAS_HISTORICO_MAX: number;
    ANALISE_PRIORIZACAO_ENABLED: boolean;
    ANALISE_PRIORIZACAO_PESOS: {
        duracaoMs: number;
        ocorrencias: number;
        penalidadeReuso: number;
    };
    LOG_ESTRUTURADO: boolean;
    ANALISE_INCREMENTAL_ENABLED: boolean;
    ANALISE_INCREMENTAL_STATE_PATH: string;
    ANALISE_INCREMENTAL_VERSION: number;
    PERF_SNAPSHOT_DIR: string;
    ESTRUTURA_TARGETS: {
        TESTS_RAIZ_DIR: string;
        SCRIPTS_DIR: string;
        CONFIG_DIR: string;
        TYPES_DIR: string;
        DOCS_FRAGMENTS_DIR: string;
    };
    STRUCTURE_PLUGINS: never[];
    STRUCTURE_AUTO_FIX: boolean;
    STRUCTURE_CONCURRENCY: number;
    STRUCTURE_LAYERS: {};
    STRUCTURE_REVERSE_MAP_PATH: string;
    ESTRUTURA_PLANO_MAX_FILE_SIZE: number;
    ESTRUTURA_ARQUIVOS_RAIZ_MAX: number;
    STATE_DIR: string;
    ZELADOR_STATE_DIR: string;
    COMPACT_MODE: boolean;
    SCAN_ONLY: boolean;
    ANALISE_SCAN_ONLY: boolean;
    PARSE_ERRO_AGRUPAR: boolean;
    PARSE_ERRO_MAX_POR_ARQUIVO: number;
    PARSE_ERRO_FALHA: boolean;
};
export declare const config: typeof configDefault & {
    __OVERRIDES__?: Record<string, {
        from: unknown;
        to: unknown;
        fonte: string;
    }>;
};
type DiffRegistro = {
    from: unknown;
    to: unknown;
    fonte: string;
};
export declare function inicializarConfigDinamica(overridesCli?: Record<string, unknown>): Promise<Record<string, DiffRegistro>>;
export declare function aplicarConfigParcial(partial: Record<string, unknown>): Record<string, DiffRegistro>;
export {};
//# sourceMappingURL=cosmos.d.ts.map
=======
  VERBOSE: boolean;
  DEV_MODE: boolean;
  AUTOANALISE_CONCURRENCY: number;
  SAFE_MODE: boolean;
  ALLOW_PLUGINS: boolean;
  ALLOW_EXEC: boolean;
  ALLOW_MUTATE_FS: boolean;
  GUARDIAN_ENABLED: boolean;
  GUARDIAN_ENFORCE_PROTECTION: boolean;
  GUARDIAN_BASELINE: string;
  GUARDIAN_ALLOW_ADDS: boolean;
  GUARDIAN_ALLOW_CHG: boolean;
  GUARDIAN_ALLOW_DELS: boolean;
  GUARDIAN_IGNORE_PATTERNS: string[];
  REPORT_SILENCE_LOGS: boolean;
  SUPPRESS_PARCIAL_LOGS: boolean;
  REPORT_EXPORT_ENABLED: boolean;
  REPORT_OUTPUT_DIR: string;
  RELATORIO_SAUDE_TABELA_ENABLED: boolean;
  RELATORIO_SAUDE_DETALHADO_VERBOSE: boolean;
  ORACULO_STATE_DIR: string;
  ZELADOR_ABANDONED_DIR: string;
  ZELADOR_PENDING_PATH: string;
  ZELADOR_REACTIVATE_PATH: string;
  ZELADOR_HISTORY_PATH: string;
  ZELADOR_REPORT_PATH: string;
  ZELADOR_GHOST_INACTIVITY_DAYS: number;
  ZELADOR_IGNORE_PATTERNS: string[];
  CLI_INCLUDE_PATTERNS: string[];
  CLI_INCLUDE_GROUPS: string[][];
  CLI_EXCLUDE_PATTERNS: string[];
  INCLUDE_EXCLUDE_RULES: IncludeExcludeConfig;
  ZELADOR_LINE_THRESHOLD: number;
  SCANNER_EXTENSOES_COM_AST: string[];
  VIGIA_TOP_N: number;
  ANALISE_LIMITES: {
    FUNCOES_LONGAS: {
      MAX_LINHAS: number;
      MAX_PARAMETROS: number;
      MAX_ANINHAMENTO: number;
    };
  };
  ANALISE_AST_CACHE_ENABLED: boolean;
  ANALISE_METRICAS_ENABLED: boolean;
  ANALISE_TIMEOUT_POR_ANALISTA_MS: number;
  WORKER_POOL_ENABLED: boolean;
  WORKER_POOL_MAX_WORKERS: number;
  WORKER_POOL_BATCH_SIZE: number;
  ANALISE_METRICAS_HISTORICO_PATH: string;
  ANALISE_METRICAS_HISTORICO_MAX: number;
  ANALISE_PRIORIZACAO_ENABLED: boolean;
  ANALISE_PRIORIZACAO_PESOS: {
    duracaoMs: number;
    ocorrencias: number;
    penalidadeReuso: number;
  };
  LOG_ESTRUTURADO: boolean;
  ANALISE_INCREMENTAL_ENABLED: boolean;
  ANALISE_INCREMENTAL_STATE_PATH: string;
  ANALISE_INCREMENTAL_VERSION: number;
  PERF_SNAPSHOT_DIR: string;
  ESTRUTURA_TARGETS: {
    TESTS_RAIZ_DIR: string;
    SCRIPTS_DIR: string;
    CONFIG_DIR: string;
    TYPES_DIR: string;
    DOCS_FRAGMENTS_DIR: string;
  };
  STRUCTURE_PLUGINS: never[];
  STRUCTURE_AUTO_FIX: boolean;
  STRUCTURE_CONCURRENCY: number;
  STRUCTURE_LAYERS: {};
  STRUCTURE_REVERSE_MAP_PATH: string;
  ESTRUTURA_PLANO_MAX_FILE_SIZE: number;
  ESTRUTURA_ARQUIVOS_RAIZ_MAX: number;
  STATE_DIR: string;
  ZELADOR_STATE_DIR: string;
  COMPACT_MODE: boolean;
  SCAN_ONLY: boolean;
  ANALISE_SCAN_ONLY: boolean;
  PARSE_ERRO_AGRUPAR: boolean;
  PARSE_ERRO_MAX_POR_ARQUIVO: number;
  PARSE_ERRO_FALHA: boolean;
};
export declare const config: typeof configDefault & {
  __OVERRIDES__?: Record<
    string,
    {
      from: unknown;
      to: unknown;
      fonte: string;
    }
  >;
};
type DiffRegistro = {
  from: unknown;
  to: unknown;
  fonte: string;
};
export declare function inicializarConfigDinamica(
  overridesCli?: Record<string, unknown>,
): Promise<Record<string, DiffRegistro>>;
export declare function aplicarConfigParcial(
  partial: Record<string, unknown>,
): Record<string, DiffRegistro>;
export {};
//# sourceMappingURL=cosmos.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
