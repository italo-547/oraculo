// SPDX-License-Identifier: MIT
import { salvarEstado, lerEstado } from '@zeladores/util/persistencia.js';
import path from 'node:path';
import { log } from '@nucleo/constelacao/log.js';
import { config } from '@nucleo/constelacao/cosmos.js';
import { gerarSnapshotDoConteudo } from './hash.js';
const DESTINO_PADRAO = path.join(config.STATE_DIR, 'integridade.json');
/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 */
export async function salvarRegistros(fileEntries, destino = DESTINO_PADRAO) {
    const registros = [];
    for (const { relPath, content } of fileEntries) {
        if (!relPath || typeof content !== 'string' || !content.trim())
            continue;
        const hash = gerarSnapshotDoConteudo(content);
        registros.push({ arquivo: relPath, hash });
    }
    await import('node:fs').then((fs) => fs.promises.mkdir(path.dirname(destino), { recursive: true }));
    await salvarEstado(destino, registros);
    log.sucesso(`🛡️ Registro de integridade salvo em: ${destino}`);
}
/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 */
export async function carregarRegistros(caminho = DESTINO_PADRAO) {
    try {
        return await lerEstado(caminho);
    }
    catch {
        log.aviso(`⚠️ Nenhum registro encontrado em ${caminho}`);
        return [];
    }
}
//# sourceMappingURL=registros.js.map