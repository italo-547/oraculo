import { executarInquisicao as executarExecucao } from './executor.js';
import type { InquisicaoOptions, Tecnica, ResultadoInquisicaoCompleto } from '../tipos/tipos.js';
export declare const tecnicas: Tecnica[];
export declare function iniciarInquisicao(baseDir?: string, options?: InquisicaoOptions): Promise<ResultadoInquisicaoCompleto>;
export { executarExecucao as executarInquisicao };
//# sourceMappingURL=inquisidor.d.ts.map