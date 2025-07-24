import { gerarSnapshotDoConteudo } from './hash.js';
/**
 * Compara os arquivos atuais com os registros de integridade salvos e detecta divergências.
 *
 * @param fileEntries Arquivos atuais lidos do sistema
 * @param registrosSalvos Registros prévios salvos (hashes de referência)
 * @returns Resultado contendo lista de arquivos corrompidos e total verificado
 */
export async function verificarRegistros(fileEntries, registrosSalvos) {
    const registrosMap = new Map(registrosSalvos.map(r => [r.arquivo, r.hash]));
    const corrompidos = [];
    for (const { relPath, content } of fileEntries) {
        if (!relPath || !content?.trim())
            continue;
        const hashAtual = gerarSnapshotDoConteudo(content).hash;
        const hashEsperado = registrosMap.get(relPath);
        if (hashEsperado && hashAtual !== hashEsperado) {
            corrompidos.push(relPath);
        }
    }
    return {
        corrompidos,
        verificados: registrosSalvos.length
    };
}
