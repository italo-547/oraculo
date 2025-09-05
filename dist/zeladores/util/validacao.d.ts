/** Normaliza um caminho assegurando que permanece dentro da CWD (remove tentativas de escape). */
export declare function normalizarPathLocal(p: string): string;
export declare function validarNumeroPositivo(v: unknown, nome: string): number | null;
export interface ErroValidacaoCombinacao {
<<<<<<< HEAD
    codigo: string;
    mensagem: string;
}
/** Regras simples de combinação de flags globais. Expandir conforme novos casos. */
export declare function validarCombinacoes(flags: Record<string, unknown>): ErroValidacaoCombinacao[];
export declare function sanitizarFlags(flags: Record<string, unknown>): void;
//# sourceMappingURL=validacao.d.ts.map
=======
  codigo: string;
  mensagem: string;
}
/** Regras simples de combinação de flags globais. Expandir conforme novos casos. */
export declare function validarCombinacoes(
  flags: Record<string, unknown>,
): ErroValidacaoCombinacao[];
export declare function sanitizarFlags(flags: Record<string, unknown>): void;
//# sourceMappingURL=validacao.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
