import type { FileEntryWithAst } from '@tipos/tipos.js';
interface ResultadoEstrutural {
<<<<<<< HEAD
    arquivo: string;
    ideal: string | null;
    atual: string;
    motivo?: string;
}
export declare function corrigirEstrutura(mapa: ResultadoEstrutural[], fileEntries: FileEntryWithAst[], baseDir?: string): Promise<void>;
export {};
//# sourceMappingURL=corretor-estrutura.d.ts.map
=======
  arquivo: string;
  ideal: string | null;
  atual: string;
  motivo?: string;
}
export declare function corrigirEstrutura(
  mapa: ResultadoEstrutural[],
  fileEntries: FileEntryWithAst[],
  baseDir?: string,
): Promise<void>;
export {};
//# sourceMappingURL=corretor-estrutura.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
