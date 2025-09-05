import type { FileEntryWithAst } from '@tipos/tipos.js';
export interface SinaisProjetoAvancados {
  funcoes: number;
  imports: string[];
  variaveis: number;
  tipos: string[];
  classes: number;
  frameworksDetectados: string[];
  dependencias: string[];
  scripts: string[];
  pastasPadrao: string[];
  arquivosPadrao: string[];
  arquivosConfig: string[];
}
export declare function extrairSinaisAvancados(
  fileEntries: FileEntryWithAst[],
  packageJson?: Record<string, unknown>,
): SinaisProjetoAvancados;
//# sourceMappingURL=sinais-projeto.d.ts.map
