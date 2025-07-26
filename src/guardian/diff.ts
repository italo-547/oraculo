import config from '../nucleo/constelacao/cosmos.js';

export interface SnapshotDiff {
  removidos: string[];
  adicionados: string[];
  alterados: string[];
}

/**
 * Compara dois snapshots de integridade (hash por arquivo) e retorna as diferenças encontradas.
 */
export function diffSnapshots(
  before: Record<string, string>,
  after: Record<string, string>
): SnapshotDiff {
  const removidos = Object.keys(before).filter(key => !(key in after));
  const adicionados = Object.keys(after).filter(key => !(key in before));
  const alterados = Object.keys(before).filter(
    key => key in after && before[key] !== after[key]
  );
  return { removidos, adicionados, alterados };
}

/**
 * Gera mensagens de erro de integridade com base nas permissões configuradas.
 */
export function verificarErros(diffs: SnapshotDiff): string[] {
  const erros: string[] = [];

  if (diffs.removidos.length > 0 && !config.GUARDIAN_ALLOW_DELS) {
    erros.push(`🗑️ Arquivos removidos: ${diffs.removidos.join(', ')}`);
  }
  if (diffs.adicionados.length > 0 && !config.GUARDIAN_ALLOW_ADDS) {
    erros.push(`📁 Arquivos adicionados: ${diffs.adicionados.join(', ')}`);
  }
  if (diffs.alterados.length > 0 && !config.GUARDIAN_ALLOW_CHG) {
    erros.push(`✏️ Arquivos alterados: ${diffs.alterados.join(', ')}`);
  }

  return erros;
}