import type { FileEntryWithAst } from '../tipos/tipos.js';
interface ResultadoEstrutural {
    arquivo: string;
    atual: string;
    ideal: string | null;
}
export declare function analisarEstrutura(fileEntries: FileEntryWithAst[], _baseDir?: string): Promise<ResultadoEstrutural[]>;
export { analisarEstrutura as alinhamentoEstrutural };
//# sourceMappingURL=analista-estrutura.d.ts.map