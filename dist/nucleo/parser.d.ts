import { File as BabelFile } from '@babel/types';
interface BabelFileExtra extends BabelFile {
<<<<<<< HEAD
    oraculoExtra?: {
        lang: string;
        rawAst: unknown;
    };
=======
  oraculoExtra?: {
    lang: string;
    rawAst: unknown;
  };
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
type ParserFunc = (codigo: string, plugins?: string[]) => BabelFile | BabelFileExtra | null;
export declare const PARSERS: Map<string, ParserFunc>;
export declare const EXTENSOES_SUPORTADAS: string[];
interface DecifrarSintaxeOpts {
<<<<<<< HEAD
    plugins?: string[];
    timeoutMs?: number;
}
export declare function decifrarSintaxe(codigo: string, ext: string, opts?: DecifrarSintaxeOpts): Promise<BabelFile | null>;
export {};
//# sourceMappingURL=parser.d.ts.map
=======
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
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
