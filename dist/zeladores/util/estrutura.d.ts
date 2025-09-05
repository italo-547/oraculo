export type NomeacaoEstilo = 'kebab' | 'dots' | 'camel';
export interface OpcoesEstrategista {
<<<<<<< HEAD
    preset?: string;
    raizCodigo?: string;
    criarSubpastasPorEntidade?: boolean;
    estiloPreferido?: NomeacaoEstilo;
    categoriasMapa?: Record<string, string>;
    ignorarPastas?: string[];
}
export declare const CATEGORIAS_DEFAULT: Required<NonNullable<OpcoesEstrategista['categoriasMapa']>>;
export declare const DEFAULT_OPCOES: Required<Pick<OpcoesEstrategista, 'raizCodigo' | 'criarSubpastasPorEntidade' | 'categoriasMapa' | 'ignorarPastas'>> & Pick<OpcoesEstrategista, 'estiloPreferido'>;
export declare const PRESETS: Record<string, Partial<typeof DEFAULT_OPCOES> & {
    nome: string;
}>;
export interface ParseNomeResultado {
    entidade: string | null;
    categoria: string | null;
=======
  preset?: string;
  raizCodigo?: string;
  criarSubpastasPorEntidade?: boolean;
  estiloPreferido?: NomeacaoEstilo;
  categoriasMapa?: Record<string, string>;
  ignorarPastas?: string[];
}
export declare const CATEGORIAS_DEFAULT: Required<
  NonNullable<OpcoesEstrategista['categoriasMapa']>
>;
export declare const DEFAULT_OPCOES: Required<
  Pick<
    OpcoesEstrategista,
    'raizCodigo' | 'criarSubpastasPorEntidade' | 'categoriasMapa' | 'ignorarPastas'
  >
> &
  Pick<OpcoesEstrategista, 'estiloPreferido'>;
export declare const PRESETS: Record<
  string,
  Partial<typeof DEFAULT_OPCOES> & {
    nome: string;
  }
>;
export interface ParseNomeResultado {
  entidade: string | null;
  categoria: string | null;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
export declare function normalizarRel(p: string): string;
export declare function deveIgnorar(rel: string, ignorar: string[]): boolean;
export declare function parseNomeArquivo(baseName: string): ParseNomeResultado;
<<<<<<< HEAD
export declare function destinoPara(relPath: string, raizCodigo: string, criarSubpastasPorEntidade: boolean, categoriasMapa: Record<string, string>): {
    destinoDir: string | null;
    motivo?: string;
};
export declare function carregarConfigEstrategia(baseDir: string, overrides?: OpcoesEstrategista): Promise<Required<typeof DEFAULT_OPCOES>>;
//# sourceMappingURL=estrutura.d.ts.map
=======
export declare function destinoPara(
  relPath: string,
  raizCodigo: string,
  criarSubpastasPorEntidade: boolean,
  categoriasMapa: Record<string, string>,
): {
  destinoDir: string | null;
  motivo?: string;
};
export declare function carregarConfigEstrategia(
  baseDir: string,
  overrides?: OpcoesEstrategista,
): Promise<Required<typeof DEFAULT_OPCOES>>;
//# sourceMappingURL=estrutura.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
