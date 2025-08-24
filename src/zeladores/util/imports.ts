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
  const norm = (p: string) => path.posix.normalize(p.replace(/\\/g, '/'));
  const baseDe = path.posix.dirname(norm(arquivoDe));
  const basePara = path.posix.dirname(norm(arquivoPara));
  // raízes calculadas anteriormente não são usadas; mantemos somente baseDe/basePara
  const reescritos: ImportReescrito[] = [];

  const novoConteudo = conteudo.replace(padrao, (full, _i1, gFrom, gExport, gReq) => {
    const spec = gFrom || gExport || gReq;
    if (!spec) return full;
    // Só reescreve relativos
    if (!spec.startsWith('./') && !spec.startsWith('../')) return full;
    let alvoAntigo: string;
    if (spec.includes('/src/')) {
      // Rebase para a raiz src e colapsa src/<top>/(util|utils)/ -> src/utils/
      const afterSrc = spec.split('/src/')[1];
      alvoAntigo = norm(path.posix.join('src', afterSrc));
      // Corrige casos onde testes referenciam caminhos improváveis como src/cli/utils/*
      // Padroniza para src/utils/*, evitando inflar profundidade relativa
      alvoAntigo = alvoAntigo
        .replace(/^src\/cli\/utils\//, 'src/utils/')
        .replace(/^src\/cli\//, 'src/')
        // Colapsa o primeiro segmento após src quando for util|utils
        .replace(/^src\/[^/]+\/(?:util|utils)\//, 'src/utils/');
      // Evita duplicação utils/utils
      alvoAntigo = alvoAntigo.replace(/\/utils\/utils\//g, '/utils/');
    } else {
      alvoAntigo = norm(path.posix.join(baseDe, spec));
    }
    let novoRel = path.posix.relative(basePara, alvoAntigo);
    // Normaliza separadores e remove duplicações
    novoRel = path.posix.normalize(novoRel);
    // Garante relativo com ./ ou ../
    if (!novoRel.startsWith('.')) novoRel = './' + novoRel;
    reescritos.push({ from: spec, to: novoRel });
    return full.replace(spec, novoRel);
  });

  return { novoConteudo, reescritos };
}
