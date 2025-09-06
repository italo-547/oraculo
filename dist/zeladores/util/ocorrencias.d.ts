/**
 * Helpers utilitários para manipulação de ocorrências e métricas de analistas.
 *
 * Observação: centralizados conforme diretriz de helpers em src/zeladores/util/.
 */
/**
 * Deduplica ocorrências preservando a primeira ocorrência encontrada.
 * A chave de deduplicação é composta por: relPath|linha|tipo|mensagem.
 */
export declare function dedupeOcorrencias<T extends {
    relPath?: string;
    linha?: number;
    tipo?: string;
    mensagem?: string;
}>(arr: T[]): T[];
/**
 * Agrupa métricas de analistas por nome, somando duração e ocorrências e contando execuções.
 * Retorna array ordenado por ocorrências desc, depois duração desc.
 */
export declare function agruparAnalistas(analistas?: Array<Record<string, unknown>>): Array<{
    nome: string;
    duracaoMs: number;
    ocorrencias: number;
    execucoes: number;
    global: boolean;
}>;
//# sourceMappingURL=ocorrencias.d.ts.map