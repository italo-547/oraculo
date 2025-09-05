import type { FileEntryWithAst } from '@tipos/tipos.js';
/**
 * Exportado apenas para testes. Não usar fora de testes!
 */
export declare const CAMADAS: Record<string, string>;
interface ResultadoEstrutural {
<<<<<<< HEAD
    arquivo: string;
    atual: string;
    ideal: string | null;
    motivo?: string;
}
export declare function analisarEstrutura(fileEntries: FileEntryWithAst[], _baseDir?: string): Promise<ResultadoEstrutural[]>;
export { analisarEstrutura as alinhamentoEstrutural };
//# sourceMappingURL=analista-estrutura.d.ts.map
=======
  arquivo: string;
  atual: string;
  ideal: string | null;
  motivo?: string;
}
export declare function analisarEstrutura(
  fileEntries: FileEntryWithAst[],
  _baseDir?: string,
): Promise<ResultadoEstrutural[]>;
export { analisarEstrutura as alinhamentoEstrutural };
//# sourceMappingURL=analista-estrutura.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
