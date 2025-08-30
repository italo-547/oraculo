import type { FileEntryWithAst } from '../tipos/tipos.js';
interface ResultadoEstrutural {
    arquivo: string;
    ideal: string | null;
    atual: string;
    motivo?: string;
}
export declare function corrigirEstrutura(mapa: ResultadoEstrutural[], fileEntries: FileEntryWithAst[], baseDir?: string): Promise<void>;
export {};
//# sourceMappingURL=corretor-estrutura.d.ts.map