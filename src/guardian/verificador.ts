import { gerarSnapshotDoConteudo } from './hash.js';
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
<<<<<<< HEAD
export function verificarRegistros(
=======
export async function verificarRegistros(
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
  fileEntries: FileEntry[],
  registrosSalvos: RegistroIntegridade[]
): Promise<ResultadoVerificacao> {
  const registrosMap = new Map(registrosSalvos.map(r => [r.arquivo, r.hash]));
  const corrompidos: string[] = [];

  for (const { relPath, content } of fileEntries) {
    if (!relPath || !content?.trim()) continue;
    const hashAtual = gerarSnapshotDoConteudo(content); // retorna string
    const hashEsperado = registrosMap.get(relPath);
    if (hashEsperado && hashAtual !== hashEsperado) {
      corrompidos.push(relPath);
    }
  }

<<<<<<< HEAD
  return Promise.resolve({
    corrompidos,
    verificados: registrosSalvos.length
  });
=======
  return {
    corrompidos,
    verificados: registrosSalvos.length
  };
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
}