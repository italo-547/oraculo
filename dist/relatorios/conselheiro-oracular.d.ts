/**
 * Contexto que aciona o conselho oracular.
 */
export interface ConselhoContexto {
    hora?: number;
    arquivosParaCorrigir?: number;
    arquivosParaPodar?: number;
    totalOcorrenciasAnaliticas?: number;
    integridadeGuardian?: string;
}
/**
 * Emite um conselho gentil quando o contexto sugere que o(a) dev precisa respirar.
 */
export declare function emitirConselhoOracular(estresse: ConselhoContexto): void;
//# sourceMappingURL=conselheiro-oracular.d.ts.map