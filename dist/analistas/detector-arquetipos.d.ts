<<<<<<< HEAD
import type { ContextoExecucao, ResultadoDeteccaoArquetipo, SnapshotEstruturaBaseline, ArquetipoDrift, ArquetipoPersonalizado } from '@tipos/tipos.js';
export declare function detectarArquetipos(contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>, baseDir: string): Promise<{
    candidatos: ResultadoDeteccaoArquetipo[];
    baseline?: SnapshotEstruturaBaseline;
    drift?: ArquetipoDrift;
    arquetipoPersonalizado?: ArquetipoPersonalizado | null;
}>;
//# sourceMappingURL=detector-arquetipos.d.ts.map
=======
import type {
  ContextoExecucao,
  ResultadoDeteccaoArquetipo,
  SnapshotEstruturaBaseline,
  ArquetipoDrift,
  ArquetipoPersonalizado,
} from '@tipos/tipos.js';
export declare function detectarArquetipos(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  baseDir: string,
): Promise<{
  candidatos: ResultadoDeteccaoArquetipo[];
  baseline?: SnapshotEstruturaBaseline;
  drift?: ArquetipoDrift;
  arquetipoPersonalizado?: ArquetipoPersonalizado | null;
}>;
//# sourceMappingURL=detector-arquetipos.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
