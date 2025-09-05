import { FileEntry } from '@tipos/tipos.js';
export interface RegistroIntegridade {
  arquivo: string;
  hash: string;
}
/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 */
export declare function salvarRegistros(fileEntries: FileEntry[], destino?: string): Promise<void>;
/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 */
export declare function carregarRegistros(caminho?: string): Promise<RegistroIntegridade[]>;
//# sourceMappingURL=registros.d.ts.map
