export declare const config: {
    DEV_MODE: boolean;
    AUTOANALISE_CONCURRENCY: number;
    GUARDIAN_ENABLED: boolean;
    GUARDIAN_ENFORCE_PROTECTION: boolean;
    GUARDIAN_BASELINE: string;
    GUARDIAN_ALLOW_ADDS: boolean;
    GUARDIAN_ALLOW_CHG: boolean;
    GUARDIAN_ALLOW_DELS: boolean;
    REPORT_SILENCE_LOGS: boolean;
    REPORT_EXPORT_ENABLED: boolean;
    REPORT_OUTPUT_DIR: string;
    ORACULO_STATE_DIR: string;
    ZELADOR_ABANDONED_DIR: string;
    ZELADOR_PENDING_PATH: string;
    ZELADOR_REACTIVATE_PATH: string;
    ZELADOR_HISTORY_PATH: string;
    ZELADOR_REPORT_PATH: string;
    ZELADOR_GHOST_INACTIVITY_DAYS: number;
    ZELADOR_IGNORE_PATTERNS: string[];
    ZELADOR_LINE_THRESHOLD: number;
    ANALISTA_THRESHOLD_CONST_REQUIRE: number;
    ANALISTA_USAGE_TOP_N: number;
    BOT_VALIDATOR_RULES: {
        name: string;
        missingType: string;
        resolucao: string;
    }[];
    CORRETOR_ESTRUTURA_AUTO_FIX: boolean;
    STRUCTURE_LAYERS: {
        service: string;
        controller: string;
        util: string;
        model: string;
    };
    STRUCTURE_CONCURRENCY: number;
    STRUCTURE_AUTO_FIX: boolean;
    STRUCTURE_PLUGINS: never[];
    PLUGINS_ENABLED: boolean;
    PLUGINS_DIR: string;
    SCANNER_EXTENSOES_COM_AST: string[];
};
export default config;
//# sourceMappingURL=cosmos.d.ts.map