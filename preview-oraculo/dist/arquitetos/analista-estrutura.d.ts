import type { FileEntryWithAst } from '@tipos/tipos.js';
/**
 * Exportado apenas para testes. Não usar fora de testes!
 */
export declare const CAMADAS: Record<string, string>;
interface ResultadoEstrutural {
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
