import type { ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';
export declare function exportarRelatorioArquetiposMarkdown(destino: string, candidatos: ResultadoDeteccaoArquetipo[], contexto?: {
    origem?: string;
}, detalhado?: boolean): Promise<void>;
export declare function exportarRelatorioArquetiposJson(destino: string, candidatos: ResultadoDeteccaoArquetipo[], contexto?: {
    origem?: string;
}, detalhado?: boolean): Promise<void>;
//# sourceMappingURL=relatorio-arquetipos.d.ts.map