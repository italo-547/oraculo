import { FileEntry } from '../tipos/tipos.js';
import { RegistroIntegridade } from './registros.js';
export interface ResultadoVerificacao {
    corrompidos: string[];
    verificados: number;
}
/**
 * Compara os arquivos atuais com os registros de integridade salvos e detecta divergências.
 *
 * @param fileEntries Arquivos atuais lidos do sistema
 * @param registrosSalvos Registros prévios salvos (hashes de referência)
 * @returns Resultado contendo lista de arquivos corrompidos e total verificado
 */
export declare function verificarRegistros(fileEntries: FileEntry[], registrosSalvos: RegistroIntegridade[]): Promise<ResultadoVerificacao>;
//# sourceMappingURL=verificador.d.ts.map