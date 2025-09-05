import type { Pendencia } from '@tipos/tipos.js';
export declare function gerarRelatorioPodaMarkdown(caminho: string, podados: Pendencia[], mantidos: Pendencia[], opcoes?: {
    simulado?: boolean;
}): Promise<void>;
export declare function gerarRelatorioPodaJson(caminho: string, podados: Pendencia[], mantidos: Pendencia[]): Promise<void>;
//# sourceMappingURL=relatorio-poda.d.ts.map