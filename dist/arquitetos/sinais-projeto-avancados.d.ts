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
import type { ArquetipoEstruturaDef, ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';
export declare function scoreArquetipo(def: ArquetipoEstruturaDef, _arquivos: string[], // prefixo _ para ignorar warning de unused
_sinaisAvancados?: SinaisProjetoAvancados): ResultadoDeteccaoArquetipo;
export declare function extrairSinaisAvancados(fileEntries: FileEntryWithAst[], packageJson?: Record<string, unknown>, _p0?: unknown, _baseDir?: string, _arquivos?: string[]): SinaisProjetoAvancados;
//# sourceMappingURL=sinais-projeto-avancados.d.ts.map
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
import type { ArquetipoEstruturaDef, ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';
export declare function scoreArquetipo(
  def: ArquetipoEstruturaDef,
  _arquivos: string[], // prefixo _ para ignorar warning de unused
  _sinaisAvancados?: SinaisProjetoAvancados,
): ResultadoDeteccaoArquetipo;
export declare function extrairSinaisAvancados(
  fileEntries: FileEntryWithAst[],
  packageJson?: Record<string, unknown>,
  _p0?: unknown,
  _baseDir?: string,
  _arquivos?: string[],
): SinaisProjetoAvancados;
//# sourceMappingURL=sinais-projeto-avancados.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
