import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';
import path from 'node:path';
import { BASELINE_PATH } from './constantes.js';

/**
 * Representa o estado salvo de integridade de arquivos no baseline.
 * Mapeia caminho relativo de arquivo para hash (string).
 */
export type SnapshotBaseline = Record<string, string>;

/**
 * Lê o baseline atual do sistema de integridade.
 * Retorna null se o arquivo não existir ou estiver malformado.
 */
export async function carregarBaseline(): Promise<SnapshotBaseline | null> {
  try {
    const json = await lerEstado<SnapshotBaseline>(BASELINE_PATH);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const entries = Object.entries(json as Record<string, unknown>).filter(
        ([k, v]) => typeof k === 'string' && typeof v === 'string',
      );
      return Object.fromEntries(entries) as SnapshotBaseline;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Salva um novo baseline de integridade em disco, sobrescrevendo qualquer estado anterior.
 */
export async function salvarBaseline(snapshot: SnapshotBaseline): Promise<void> {
  await import('node:fs').then((fs) =>
    fs.promises.mkdir(path.dirname(BASELINE_PATH), { recursive: true }),
  );
  await salvarEstado(BASELINE_PATH, snapshot);
}
