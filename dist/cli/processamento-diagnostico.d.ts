import type { ResultadoGuardian, FileEntryWithAst, MetricaExecucao } from '../tipos/tipos.js';
import { detectarArquetipos } from '../analistas/detector-arquetipos.js';
export interface OpcoesProcessamentoDiagnostico {
    guardianCheck?: boolean;
    verbose?: boolean;
    exclude?: string[];
    listarAnalistas?: boolean;
    detalhado?: boolean;
    compact?: boolean;
    include?: string[];
    json?: boolean;
    criarArquetipo?: boolean;
}
export interface ResultadoProcessamentoDiagnostico {
    totalOcorrencias: number;
    temErro: boolean;
    guardianResultado?: ResultadoGuardian;
    arquetiposResultado?: Awaited<ReturnType<typeof detectarArquetipos>>;
    fileEntriesComAst: FileEntryWithAst[];
    resultadoFinal: {
        ocorrencias?: Array<{
            tipo?: string;
            relPath?: string;
            linha?: number;
            mensagem?: string;
            severidade?: string;
        }>;
        metricas?: MetricaExecucao;
    };
}
export declare function processPatternListAchatado(raw: string[] | undefined): string[];
export declare function processPatternGroups(raw: string[] | undefined): string[][];
export declare function expandIncludes(list: string[]): string[];
export declare function getDefaultExcludes(): string[];
export declare function configurarFiltros(includeGroupsRaw: string[][], includeListFlat: string[], excludeList: string[], incluiNodeModules: boolean): void;
export declare function exibirBlocoFiltros(includeGroupsExpanded: string[][], includeListFlat: string[], excludeList: string[], incluiNodeModules: boolean): void;
export declare function listarAnalistas(): Promise<void>;
export declare function processarDiagnostico(opts: OpcoesProcessamentoDiagnostico): Promise<ResultadoProcessamentoDiagnostico>;
//# sourceMappingURL=processamento-diagnostico.d.ts.map