import { executarInquisicao as executarExecucao, registrarUltimasMetricas } from './executor.js';
import type { FileEntry, FileEntryWithAst, InquisicaoOptions, ResultadoInquisicaoCompleto, Tecnica } from '../tipos/tipos.js';
export declare const tecnicas: Tecnica[];
export declare function prepararComAst(entries: FileEntry[], baseDir: string): Promise<FileEntryWithAst[]>;
export declare function iniciarInquisicao(baseDir?: string, options?: InquisicaoOptions): Promise<ResultadoInquisicaoCompleto>;
export { executarExecucao as executarInquisicao, registrarUltimasMetricas };
//# sourceMappingURL=inquisidor.d.ts.map