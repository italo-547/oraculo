import { File as BabelFile } from '@babel/types';
export declare const EXTENSOES_SUPORTADAS: string[];
interface DecifrarSintaxeOpts {
    plugins?: string[];
    timeoutMs?: number;
}
export declare function decifrarSintaxe(codigo: string, ext: string, opts?: DecifrarSintaxeOpts): Promise<BabelFile | null>;
export {};
//# sourceMappingURL=parser.d.ts.map