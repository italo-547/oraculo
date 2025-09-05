import type { FileEntryWithAst, ResultadoInquisicao, Tecnica } from '@tipos/tipos.js';
import { MetricaExecucao } from '@tipos/tipos.js';
<<<<<<< HEAD
export declare function executarInquisicao(fileEntriesComAst: FileEntryWithAst[], tecnicas: Tecnica[], baseDir: string, guardianResultado: unknown, opts?: {
    verbose?: boolean;
    compact?: boolean;
}): Promise<ResultadoInquisicao>;
export declare function registrarUltimasMetricas(metricas: MetricaExecucao | undefined): void;
//# sourceMappingURL=executor.d.ts.map
=======
export declare function executarInquisicao(
  fileEntriesComAst: FileEntryWithAst[],
  tecnicas: Tecnica[],
  baseDir: string,
  guardianResultado: unknown,
  opts?: {
    verbose?: boolean;
    compact?: boolean;
  },
): Promise<ResultadoInquisicao>;
export declare function registrarUltimasMetricas(metricas: MetricaExecucao | undefined): void;
//# sourceMappingURL=executor.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
