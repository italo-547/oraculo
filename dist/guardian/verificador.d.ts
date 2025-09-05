import { FileEntry } from '@tipos/tipos.js';
import { RegistroIntegridade } from './registros.js';
export interface ResultadoVerificacao {
<<<<<<< HEAD
    corrompidos: string[];
    verificados: number;
=======
  corrompidos: string[];
  verificados: number;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}
/**
 * Compara os arquivos atuais com os registros de integridade salvos e detecta divergências.
 *
 * @param fileEntries Arquivos atuais lidos do sistema
 * @param registrosSalvos Registros prévios salvos (hashes de referência)
 * @returns Resultado contendo lista de arquivos corrompidos e total verificado
 */
<<<<<<< HEAD
export declare function verificarRegistros(fileEntries: FileEntry[], registrosSalvos: RegistroIntegridade[]): ResultadoVerificacao;
//# sourceMappingURL=verificador.d.ts.map
=======
export declare function verificarRegistros(
  fileEntries: FileEntry[],
  registrosSalvos: RegistroIntegridade[],
): ResultadoVerificacao;
//# sourceMappingURL=verificador.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
