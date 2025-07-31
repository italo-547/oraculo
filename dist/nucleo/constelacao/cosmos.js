import path from 'node:path';
// Diretório atual do usuário (base do projeto)
const CWD = process.cwd();
// Diretórios internos do Oráculo
const ORACULO_STATE = path.join(CWD, '.oraculo');
const ZELADOR_ABANDONED = path.join(ORACULO_STATE, 'abandonados');
// Configuração global do sistema Oráculo
export const config = {
    // 🌱 Flags gerais
    DEV_MODE: process.env.NODE_ENV === 'development' || process.env.ORACULO_DEV === 'true',
    AUTOANALISE_CONCURRENCY: 5,
    // 🛡️ Guardian
    GUARDIAN_ENABLED: true,
    GUARDIAN_ENFORCE_PROTECTION: true,
    GUARDIAN_BASELINE: path.join(ORACULO_STATE, 'baseline.json'),
    GUARDIAN_ALLOW_ADDS: false,
    GUARDIAN_ALLOW_CHG: false,
    GUARDIAN_ALLOW_DELS: false,
    // 📄 Relatórios
    REPORT_SILENCE_LOGS: false,
    REPORT_EXPORT_ENABLED: false,
    REPORT_OUTPUT_DIR: path.join(CWD, 'relatorios'),
    // 📂 Zelador
    ORACULO_STATE_DIR: ORACULO_STATE,
    ZELADOR_ABANDONED_DIR: ZELADOR_ABANDONED,
    ZELADOR_PENDING_PATH: path.join(ORACULO_STATE, 'pendentes.json'),
    ZELADOR_REACTIVATE_PATH: path.join(ORACULO_STATE, 'reativar.json'),
    ZELADOR_HISTORY_PATH: path.join(ORACULO_STATE, 'historico.json'),
    ZELADOR_REPORT_PATH: path.join(ORACULO_STATE, 'poda-oraculo.md'),
    ZELADOR_GHOST_INACTIVITY_DAYS: 30,
    ZELADOR_IGNORE_PATTERNS: [
        'node_modules',
        '.git',
        'oraculo',
        'dist',
        'build',
        'coverage',
        'package-lock.json',
        'yarn.lock'
    ],
    ZELADOR_LINE_THRESHOLD: 20,
    // 🔍 Analistas
    SCANNER_EXTENSOES_COM_AST: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    VIGIA_TOP_N: 10,
    // Estrutura (plugins, layers, auto-fix, concorrência)
    STRUCTURE_PLUGINS: [],
    STRUCTURE_AUTO_FIX: false,
    STRUCTURE_CONCURRENCY: 5,
    STRUCTURE_LAYERS: {},
    // Compatibilidade/legado
    STATE_DIR: ORACULO_STATE,
    ZELADOR_STATE_DIR: ORACULO_STATE,
};
