import { gerarSnapshotDoConteudo } from './hash.js';
import { salvarRegistros, carregarRegistros } from './registros.js';
import { REGISTRO_VIGIA_CAMINHO_PADRAO } from './constantes.js';
import { log } from '../nucleo/constelacao/log.js';
/**
 * Executa uma verificação silenciosa de integridade de arquivos com base nos registros prévios.
 *
 * @param arquivos Lista de arquivos a verificar
 * @param caminhoRegistro Caminho opcional do arquivo de registros (JSON)
 * @param autoReset Se verdadeiro, atualiza os registros se alterações forem encontradas
 */
export async function vigiaOculta(arquivos, caminhoRegistro = REGISTRO_VIGIA_CAMINHO_PADRAO, autoReset = true) {
    const registros = await carregarRegistros(caminhoRegistro);
    const mapaAnterior = new Map(registros.map(r => [r.arquivo, r.hash]));
    const corrompidos = [];
    for (const { relPath, content } of arquivos) {
        if (!relPath || !content?.trim())
            continue;
        const hashAtual = gerarSnapshotDoConteudo(content); // retorna string
        const hashEsperado = mapaAnterior.get(relPath);
        if (hashEsperado && hashAtual !== hashEsperado) {
            corrompidos.push(relPath);
        }
    }
    if (corrompidos.length > 0) {
        log.aviso(`🔐 [VigiaOculta] Alterações detectadas em ${corrompidos.length} arquivo(s):`);
        for (const arq of corrompidos) {
            log.info(`  - ${arq}`);
        }
        if (autoReset) {
            await salvarRegistros(arquivos, caminhoRegistro);
            log.sucesso('🌀 Registros recalibrados automaticamente pela Vigia Oculta.\\n');
        }
    }
}
