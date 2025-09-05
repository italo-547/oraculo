// SPDX-License-Identifier: MIT
import { salvarEstado, lerEstado } from '@zeladores/util/persistencia.js';
import path from 'node:path';
import { log } from '@nucleo/constelacao/log.js';
import { config } from '@nucleo/constelacao/cosmos.js';
import { gerarSnapshotDoConteudo } from './hash.js';
import { FileEntry } from '@tipos/tipos.js';

const DESTINO_PADRAO = path.join(config.STATE_DIR, 'integridade.json');

export interface RegistroIntegridade {
  arquivo: string;
  hash: string;
}

/**
 * Salva os hashes dos arquivos fornecidos em um arquivo de integridade.
 */
export async function salvarRegistros(
  fileEntries: FileEntry[],
  destino: string = DESTINO_PADRAO,
): Promise<void> {
  const registros: RegistroIntegridade[] = [];

  for (const { relPath, content } of fileEntries) {
    if (!relPath || typeof content !== 'string' || !content.trim()) continue;
    const hash = gerarSnapshotDoConteudo(content);
    registros.push({ arquivo: relPath, hash });
  }

  await import('node:fs').then((fs) =>
    fs.promises.mkdir(path.dirname(destino), { recursive: true }),
  );
  await salvarEstado(destino, registros);
  log.sucesso(`🛡️ Registro de integridade salvo em: ${destino}`);
}

/**
 * Carrega os registros de integridade persistidos. Retorna lista vazia se não existir.
 */
export async function carregarRegistros(
  caminho: string = DESTINO_PADRAO,
): Promise<RegistroIntegridade[]> {
  try {
    return await lerEstado<RegistroIntegridade[]>(caminho);
  } catch {
    log.aviso(`⚠️ Nenhum registro encontrado em ${caminho}`);
    return [];
  }
}
