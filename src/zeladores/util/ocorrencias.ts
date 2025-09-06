// SPDX-License-Identifier: MIT
/**
 * Helpers utilitários para manipulação de ocorrências e métricas de analistas.
 *
 * Observação: centralizados conforme diretriz de helpers em src/zeladores/util/.
 */

/**
 * Deduplica ocorrências preservando a primeira ocorrência encontrada.
 * A chave de deduplicação é composta por: relPath|linha|tipo|mensagem.
 */
export function dedupeOcorrencias<
  T extends {
    relPath?: string;
    linha?: number;
    tipo?: string;
    mensagem?: string;
  },
>(arr: T[]): T[] {
  const seen = new Map<string, T>();
  for (const o of arr || []) {
    const key = `${o.relPath || ''}|${String(o.linha ?? '')}|${o.tipo || ''}|${o.mensagem || ''}`;
    if (!seen.has(key)) seen.set(key, o);
  }
  return Array.from(seen.values());
}

/**
 * Agrupa métricas de analistas por nome, somando duração e ocorrências e contando execuções.
 * Retorna array ordenado por ocorrências desc, depois duração desc.
 */
export function agruparAnalistas(analistas?: Array<Record<string, unknown>>): Array<{
  nome: string;
  duracaoMs: number;
  ocorrencias: number;
  execucoes: number;
  global: boolean;
}> {
  if (!analistas || !Array.isArray(analistas) || analistas.length === 0) return [];
  const map = new Map<
    string,
    { nome: string; duracaoMs: number; ocorrencias: number; execucoes: number; global: boolean }
  >();
  for (const a of analistas) {
    const nome = String((a && a['nome']) || 'desconhecido');
    const dur = Number((a && a['duracaoMs']) || 0);
    const occ = Number((a && a['ocorrencias']) || 0);
    const globalFlag = Boolean((a && a['global']) || false);
    const entry = map.get(nome) || {
      nome,
      duracaoMs: 0,
      ocorrencias: 0,
      execucoes: 0,
      global: false,
    };
    entry.duracaoMs += dur;
    entry.ocorrencias += occ;
    entry.execucoes += 1;
    entry.global = entry.global || globalFlag;
    map.set(nome, entry);
  }
  return Array.from(map.values()).sort((x, y) => {
    return y.ocorrencias - x.ocorrencias || y.duracaoMs - x.duracaoMs;
  });
}
