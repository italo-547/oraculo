import path from 'node:path';
const CWD = process.cwd();
const ORACULO_STATE = path.join(CWD, '.oraculo');
const ZELADOR_ABANDONED = path.join(ORACULO_STATE, 'abandonados');
export const config = {
    // 🌱 Flags gerais
    DEV_MODE: process.env.NODE_ENV === 'development' ||
        process.env.ORACULO_DEV === 'true',
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
    ANALISTA_THRESHOLD_CONST_REQUIRE: 3,
    ANALISTA_USAGE_TOP_N: 10,
    // 🤖 Bot Validator
    BOT_VALIDATOR_RULES: [
        { name: 'comando', missingType: 'erro', resolucao: 'Exporte uma propriedade "comando".' },
        { name: 'handler', missingType: 'erro', resolucao: 'Exporte uma função "handler".' },
        { name: 'descricao', missingType: 'aviso', resolucao: 'Considere exportar uma "descricao".' }
    ],
    // 🛠️ Estrutura
    CORRETOR_ESTRUTURA_AUTO_FIX: false,
    STRUCTURE_LAYERS: {
        service: 'services',
        controller: 'controllers',
        util: 'utils',
        model: 'models'
    },
    STRUCTURE_CONCURRENCY: 5,
    STRUCTURE_AUTO_FIX: false,
    STRUCTURE_PLUGINS: [],
    // 🧪 Plugins externos
    PLUGINS_ENABLED: false,
    PLUGINS_DIR: path.join(CWD, '.oraculo-plugins'),
    // 🔬 Scanner AST
    SCANNER_EXTENSOES_COM_AST: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
};
export default config;
