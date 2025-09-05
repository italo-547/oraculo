import { FileEntry } from '@tipos/tipos.js';
export interface RegistroIntegridade {
<<<<<<< HEAD
    arquivo: string;
    hash: string;
=======
  arquivo: string;
  hash: string;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 */
export declare function salvarRegistros(fileEntries: FileEntry[], destino?: string): Promise<void>;
/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 */
export declare function carregarRegistros(caminho?: string): Promise<RegistroIntegridade[]>;
<<<<<<< HEAD
//# sourceMappingURL=registros.d.ts.map
=======
//# sourceMappingURL=registros.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
