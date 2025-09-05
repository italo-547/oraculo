import { FileEntry } from '@tipos/tipos.js';
/**
 * Executa uma verificação silenciosa de integridade de arquivos com base nos registros prévios.
 *
 * @param arquivos Lista de arquivos a verificar
 * @param caminhoRegistro Caminho opcional do arquivo de registros (JSON)
 * @param autoReset Se verdadeiro, atualiza os registros se alterações forem encontradas
 */
export declare function vigiaOculta(arquivos: FileEntry[], caminhoRegistro?: string, autoReset?: boolean): Promise<void>;
//# sourceMappingURL=vigiaOculto.d.ts.map