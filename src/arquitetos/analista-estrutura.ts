// SPDX-License-Identifier: MIT
import path from 'node:path';
import pLimit from 'p-limit';
import { config } from '../nucleo/constelacao/cosmos.js';
import type { FileEntryWithAst } from '../tipos/tipos.js';

/**
 * Exportado apenas para testes. Não usar fora de testes!
 */
export const CAMADAS: Record<string, string> = {};
const CONCORRENCIA =
  typeof config.AUTOANALISE_CONCURRENCY === 'number' ? config.AUTOANALISE_CONCURRENCY : 5;

interface ResultadoEstrutural {
  arquivo: string;
  atual: string;
  ideal: string | null;
  motivo?: string;
}

export async function analisarEstrutura(
  fileEntries: FileEntryWithAst[],
  _baseDir: string = process.cwd(),
): Promise<ResultadoEstrutural[]> {
  const limit = pLimit(CONCORRENCIA);

  const resultados = await Promise.all(
    fileEntries.map((entry) =>
      limit(() => {
        const rel = entry.relPath;
        // Normaliza para separador POSIX para evitar dependência de platform e necessidade de mock em testes
        const normalizado = rel.replace(/\\/g, '/');
        const atual = normalizado.split('/')[0] || '';
        let ideal: string | null = null;

        const matchDireta = Object.entries(CAMADAS).find(([, dir]) =>
          normalizado.startsWith(dir.replace(/\\/g, '/') + '/'),
        );

        if (matchDireta) {
          ideal = matchDireta[1];
        } else {
          const nome = path.basename(rel);
          const [, tipo] = /\.([^.]+)\.[^.]+$/.exec(nome) ?? [];
          if (tipo && CAMADAS[tipo]) {
            ideal = CAMADAS[tipo];
          }
        }

        return { arquivo: rel, atual, ideal };
      }),
    ),
  );

  return resultados;
}

export { analisarEstrutura as alinhamentoEstrutural };
