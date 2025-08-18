// SPDX-License-Identifier: MIT
/**
 * Helper puro para reescrever imports relativos quando um arquivo é movido.
 * Não toca disco; apenas retorna o novo conteúdo.
 */
import path from 'node:path';

export interface ImportReescrito {
  from: string;
  to: string;
}

export function reescreverImports(
  conteudo: string,
  arquivoDe: string,
  arquivoPara: string,
): { novoConteudo: string; reescritos: ImportReescrito[] } {
  // Suporta import/export from e require simples
  const padrao =
    /(import\s+[^'";]+from\s*['"]([^'"\n]+)['"]\s*;?|export\s+\*?\s*from\s*['"]([^'"\n]+)['"];?|require\(\s*['"]([^'"\n]+)['"]\s*\))/g;
  const baseDe = path.posix.dirname(arquivoDe);
  const basePara = path.posix.dirname(arquivoPara);
  const reescritos: ImportReescrito[] = [];

  const novoConteudo = conteudo.replace(padrao, (full, _i1, gFrom, gExport, gReq) => {
    const spec = gFrom || gExport || gReq;
    if (!spec) return full;
    // Só reescreve relativos
    if (!spec.startsWith('./') && !spec.startsWith('../')) return full;
    const alvoAntigo = path.posix.normalize(path.posix.join(baseDe, spec));
    let novoRel = path.posix.relative(basePara, alvoAntigo);
    if (!novoRel.startsWith('.')) novoRel = './' + novoRel;
    reescritos.push({ from: spec, to: novoRel });
    return full.replace(spec, novoRel);
  });

  return { novoConteudo, reescritos };
}
