// SPDX-License-Identifier: MIT
/**
 * Configuração centralizada do sistema de pontuação de arquétipos
 * Valores ajustáveis para otimizar detecção e resiliência
 */
// Configuração padrão - otimizada para resiliência
export const CONFIGURACAO_PADRAO = {
    // Constantes base
    PENALIDADE_MISSING_REQUIRED: 20,
    PESO_OPTIONAL: 5,
    PESO_REQUIRED: 10,
    PESO_DEPENDENCIA: 10,
    PESO_PATTERN: 5,
    PENALIDADE_FORBIDDEN: 20,
    // Fatores adaptativos (máximos)
    FATOR_ESCALA_TAMANHO_MAX: 5, // 5x para projetos muito grandes
    FATOR_COMPLEXIDADE_MAX: 3, // 3x para projetos muito complexos
    FATOR_MATURIDADE_MAX: 3, // 3x para projetos muito maduros
    // Thresholds de decisão
    THRESHOLD_CONFIANCA_MINIMA: 30, // Mínimo para considerar válido
    THRESHOLD_DIFERENCA_DOMINANTE: 15, // Diferença para considerar dominante
    THRESHOLD_HIBRIDO_REAL: 0.3, // Fração de sobreposição para híbrido
    // Bônus e penalidades
    BONUS_COMPLETUDE_BASE: 50,
    BONUS_ESPECIFICIDADE_MULTIPLIER: 1.5,
    PENALIDADE_GENERICO_EXTREMA: 1000,
    // Ajustes por tamanho
    AJUSTE_CONFIANCA_PROJETO_GRANDE: -5,
    AJUSTE_CONFIANCA_PROJETO_PEQUENO: 10,
    LIMITE_ARQUIVOS_GRANDE: 500,
    LIMITE_ARQUIVOS_PEQUENO: 20,
    // Sistema de maturidade
    LIMITE_FUNCOES_MATURIDADE: 50,
    MULTIPLICADOR_MATURIDADE: 1.2,
};
// Configuração conservadora - mais rigorosa
export const CONFIGURACAO_CONSERVADORA = {
    ...CONFIGURACAO_PADRAO,
    THRESHOLD_CONFIANCA_MINIMA: 40,
    THRESHOLD_DIFERENCA_DOMINANTE: 20,
    PENALIDADE_MISSING_REQUIRED: 25,
    BONUS_COMPLETUDE_BASE: 40,
};
// Configuração permissiva - mais tolerante
export const CONFIGURACAO_PERMISSIVA = {
    ...CONFIGURACAO_PADRAO,
    THRESHOLD_CONFIANCA_MINIMA: 20,
    THRESHOLD_DIFERENCA_DOMINANTE: 10,
    PENALIDADE_MISSING_REQUIRED: 15,
    BONUS_COMPLETUDE_BASE: 60,
};
// Configuração atual (pode ser alterada via variável de ambiente)
export function obterConfiguracaoAtual() {
    const modo = process.env.ORACULO_MODO_PONTUACAO || 'padrao';
    switch (modo.toLowerCase()) {
        case 'conservador':
        case 'strict':
            return CONFIGURACAO_CONSERVADORA;
        case 'permissivo':
        case 'lenient':
            return CONFIGURACAO_PERMISSIVA;
        default:
            return CONFIGURACAO_PADRAO;
    }
}
//# sourceMappingURL=configuracao-pontuacao.js.map