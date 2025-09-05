import { executarInquisicao as executarExecucao, registrarUltimasMetricas } from './executor.js';
<<<<<<< HEAD
import type { FileEntry, FileEntryWithAst, InquisicaoOptions, ResultadoInquisicaoCompleto, Tecnica } from '../tipos/tipos.js';
export declare const tecnicas: Tecnica[];
export declare function prepararComAst(entries: FileEntry[], baseDir: string): Promise<FileEntryWithAst[]>;
export declare function iniciarInquisicao(baseDir?: string, options?: InquisicaoOptions): Promise<ResultadoInquisicaoCompleto>;
export { executarExecucao as executarInquisicao, registrarUltimasMetricas };
//# sourceMappingURL=inquisidor.d.ts.map
=======
import type {
  FileEntry,
  FileEntryWithAst,
  InquisicaoOptions,
  ResultadoInquisicaoCompleto,
  Tecnica,
} from '../tipos/tipos.js';
export declare const tecnicas: Tecnica[];
export declare function prepararComAst(
  entries: FileEntry[],
  baseDir: string,
): Promise<FileEntryWithAst[]>;
export declare function iniciarInquisicao(
  baseDir?: string,
  options?: InquisicaoOptions,
): Promise<ResultadoInquisicaoCompleto>;
export { executarExecucao as executarInquisicao, registrarUltimasMetricas };
//# sourceMappingURL=inquisidor.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
