import type { FileEntryWithAst, Ocorrencia } from '../tipos/tipos.js';
import type { PlanoSugestaoEstrutura } from '../tipos/plano-estrutura.js';
export interface OpcoesPlanejamento {
    preferEstrategista?: boolean;
    criarSubpastasPorEntidade?: boolean;
    preset?: string;
    categoriasMapa?: Record<string, string>;
}
export interface ResultadoPlanejamento {
    plano?: PlanoSugestaoEstrutura;
    origem: 'arquetipos' | 'estrategista' | 'nenhum';
}
export declare const OperarioEstrutura: {
    planejar(baseDir: string, fileEntriesComAst: FileEntryWithAst[], opcoes: OpcoesPlanejamento): Promise<ResultadoPlanejamento>;
    toMapaMoves(plano: PlanoSugestaoEstrutura | undefined): {
        arquivo: string;
        ideal: string | null;
        atual: string;
    }[];
    aplicar(mapaMoves: {
        arquivo: string;
        ideal: string | null;
        atual: string;
    }[], fileEntriesComAst: FileEntryWithAst[], baseDir: string): Promise<void>;
    ocorrenciasParaMapa(ocorrencias?: Ocorrencia[]): {
        arquivo: string;
        ideal: string | null;
        atual: string;
    }[];
};
//# sourceMappingURL=operario-estrutura.d.ts.map