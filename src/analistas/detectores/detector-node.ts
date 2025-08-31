// SPDX-License-Identifier: MIT
import type { ResultadoDeteccaoArquetipo } from '@tipos/tipos.js';
import { ARQUETIPOS } from '@analistas/arquetipos-defs.js';
import { scoreArquetipo } from '@analistas/deteccao/pontuador.js';

/**
 * Detector especializado para projetos Node.js/TypeScript
 * Retorna lista de candidatos de arquétipo com score/confiança
 */
export function detectarArquetipoNode(arquivos: string[]): ResultadoDeteccaoArquetipo[] {
  const temPackage = arquivos.some((a) => a.endsWith('package.json'));
  const ehNode = temPackage;
  if (!ehNode) return [];

  const candidatos = ARQUETIPOS.map((def) => scoreArquetipo(def, arquivos)).filter(
    (r) => r.score > 0,
  );

  return candidatos;
}
