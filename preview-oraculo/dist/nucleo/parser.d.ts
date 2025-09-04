import { File as BabelFile } from '@babel/types';
interface BabelFileExtra extends BabelFile {
  oraculoExtra?: {
    lang: string;
    rawAst: unknown;
  };
}
type ParserFunc = (codigo: string, plugins?: string[]) => BabelFile | BabelFileExtra | null;
export declare const PARSERS: Map<string, ParserFunc>;
export declare const EXTENSOES_SUPORTADAS: string[];
interface DecifrarSintaxeOpts {
  plugins?: string[];
  timeoutMs?: number;
}
export declare function decifrarSintaxe(
  codigo: string,
  ext: string,
  opts?: DecifrarSintaxeOpts,
): Promise<BabelFile | null>;
export {};
//# sourceMappingURL=parser.d.ts.map
