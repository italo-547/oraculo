import { promises as fs } from 'node:fs';
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
    const txt = await fs.readFile(BASELINE_PATH, 'utf-8');
    const json: unknown = JSON.parse(txt);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      // Garante que todas as chaves e valores são strings
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
  await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await fs.writeFile(BASELINE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
}
