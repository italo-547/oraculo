import type { FileEntryWithAst } from '@tipos/tipos.js';
export interface SinaisProjetoAvancados {
<<<<<<< HEAD
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
export declare function extrairSinaisAvancados(fileEntries: FileEntryWithAst[], packageJson?: Record<string, unknown>): SinaisProjetoAvancados;
//# sourceMappingURL=sinais-projeto.d.ts.map
=======
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
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
