import type { FileEntryWithAst, ResultadoInquisicao, Tecnica } from '@tipos/tipos.js';
import { MetricaExecucao } from '@tipos/tipos.js';
export declare function executarInquisicao(fileEntriesComAst: FileEntryWithAst[], tecnicas: Tecnica[], baseDir: string, guardianResultado: unknown, opts?: {
    verbose?: boolean;
    compact?: boolean;
}): Promise<ResultadoInquisicao>;
export declare function registrarUltimasMetricas(metricas: MetricaExecucao | undefined): void;
//# sourceMappingURL=executor.d.ts.map