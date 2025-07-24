import { promises as fs } from 'node:fs';
import path from 'node:path';
import { log } from '../nucleo/constelacao/log';
import config from '../nucleo/constelacao/cosmos';
import { gerarSnapshotDoConteudo } from './hash';
const DESTINO_PADRAO = path.join(config.STATE_DIR, 'integridade.json');
/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 *
 * @param fileEntries Lista de arquivos com conteúdo
 * @param destino Caminho de destino do JSON de integridade (opcional)
 */
export async function salvarRegistros(fileEntries, destino = DESTINO_PADRAO) {
    const registros = [];
    for (const file of fileEntries) {
        const { relPath, content } = file;
        if (!relPath || !content?.trim())
            continue;
        const snapshot = gerarSnapshotDoConteudo(content);
        registros.push({ arquivo: relPath, hash: snapshot.hash });
    }
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, JSON.stringify(registros, null, 2), 'utf-8');
    log.sucesso(`🛡️ Registro de integridade salvo em: ${destino}`);
}
/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 *
 * @param caminho Caminho para o arquivo de registros (padrão: ./estado/integridade.json)
 */
export async function carregarRegistros(caminho = DESTINO_PADRAO) {
    try {
        const data = await fs.readFile(caminho, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        log.aviso(`⚠️ Nenhum registro encontrado em ${caminho}`);
        return [];
    }
}
