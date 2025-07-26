import path from 'node:path';
import pLimit from 'p-limit';
import config from '../nucleo/constelacao/cosmos.js';
import type { FileEntryWithAst } from '../tipos/tipos.js';

const CAMADAS = config.STRUCTURE_LAYERS;
const CONCORRENCIA = config.STRUCTURE_CONCURRENCY ?? 5;

interface ResultadoEstrutural {
  arquivo: string;
  atual: string;
  ideal: string | null;
}

export async function analisarEstrutura(
  fileEntries: FileEntryWithAst[],
  _baseDir: string = process.cwd()
): Promise<ResultadoEstrutural[]> {
  const limit = pLimit(CONCORRENCIA);

  const resultados = await Promise.all(
    fileEntries.map(entry =>
      limit(async () => {
        const rel = entry.relPath;
        const atual = rel.split(path.sep)[0] || '';
        let ideal: string | null = null;

        const matchDireta = Object.entries(CAMADAS).find(
          ([, dir]) => rel.startsWith(dir + path.sep)
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
      })
    )
  );

  return resultados;
}

export { analisarEstrutura as alinhamentoEstrutural };