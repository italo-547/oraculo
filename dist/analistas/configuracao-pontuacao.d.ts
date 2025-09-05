/**
 * Configuração centralizada do sistema de pontuação de arquétipos
 * Valores ajustáveis para otimizar detecção e resiliência
 */
export interface ConfiguracaoPontuacao {
<<<<<<< HEAD
    PENALIDADE_MISSING_REQUIRED: number;
    PESO_OPTIONAL: number;
    PESO_REQUIRED: number;
    PESO_DEPENDENCIA: number;
    PESO_PATTERN: number;
    PENALIDADE_FORBIDDEN: number;
    FATOR_ESCALA_TAMANHO_MAX: number;
    FATOR_COMPLEXIDADE_MAX: number;
    FATOR_MATURIDADE_MAX: number;
    THRESHOLD_CONFIANCA_MINIMA: number;
    THRESHOLD_DIFERENCA_DOMINANTE: number;
    THRESHOLD_HIBRIDO_REAL: number;
    BONUS_COMPLETUDE_BASE: number;
    BONUS_ESPECIFICIDADE_MULTIPLIER: number;
    PENALIDADE_GENERICO_EXTREMA: number;
    AJUSTE_CONFIANCA_PROJETO_GRANDE: number;
    AJUSTE_CONFIANCA_PROJETO_PEQUENO: number;
    LIMITE_ARQUIVOS_GRANDE: number;
    LIMITE_ARQUIVOS_PEQUENO: number;
    LIMITE_FUNCOES_MATURIDADE: number;
    MULTIPLICADOR_MATURIDADE: number;
=======
  PENALIDADE_MISSING_REQUIRED: number;
  PESO_OPTIONAL: number;
  PESO_REQUIRED: number;
  PESO_DEPENDENCIA: number;
  PESO_PATTERN: number;
  PENALIDADE_FORBIDDEN: number;
  FATOR_ESCALA_TAMANHO_MAX: number;
  FATOR_COMPLEXIDADE_MAX: number;
  FATOR_MATURIDADE_MAX: number;
  THRESHOLD_CONFIANCA_MINIMA: number;
  THRESHOLD_DIFERENCA_DOMINANTE: number;
  THRESHOLD_HIBRIDO_REAL: number;
  BONUS_COMPLETUDE_BASE: number;
  BONUS_ESPECIFICIDADE_MULTIPLIER: number;
  PENALIDADE_GENERICO_EXTREMA: number;
  AJUSTE_CONFIANCA_PROJETO_GRANDE: number;
  AJUSTE_CONFIANCA_PROJETO_PEQUENO: number;
  LIMITE_ARQUIVOS_GRANDE: number;
  LIMITE_ARQUIVOS_PEQUENO: number;
  LIMITE_FUNCOES_MATURIDADE: number;
  MULTIPLICADOR_MATURIDADE: number;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
export declare const CONFIGURACAO_PADRAO: ConfiguracaoPontuacao;
export declare const CONFIGURACAO_CONSERVADORA: ConfiguracaoPontuacao;
export declare const CONFIGURACAO_PERMISSIVA: ConfiguracaoPontuacao;
export declare function obterConfiguracaoAtual(): ConfiguracaoPontuacao;
<<<<<<< HEAD
//# sourceMappingURL=configuracao-pontuacao.d.ts.map
=======
//# sourceMappingURL=configuracao-pontuacao.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
