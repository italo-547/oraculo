import path from 'node:path';
import pLimit from 'p-limit';
import { config } from '../nucleo/constelacao/cosmos.js';
import type { FileEntryWithAst } from '../tipos/tipos.js';

// TODO: Definir camadas de estrutura conforme necessidade do projeto
const CAMADAS: Record<string, string> = {};
<<<<<<< HEAD
const CONCORRENCIA = typeof config.AUTOANALISE_CONCURRENCY === 'number' ? config.AUTOANALISE_CONCURRENCY : 5;
=======
const CONCORRENCIA = config.AUTOANALISE_CONCURRENCY ?? 5;
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd

interface ResultadoEstrutural {
  arquivo: string;
  atual: string;
  ideal: string | null;
}

<<<<<<< HEAD
export function analisarEstrutura(
=======
export async function analisarEstrutura(
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
  fileEntries: FileEntryWithAst[],
  _baseDir: string = process.cwd()
): Promise<ResultadoEstrutural[]> {
  const limit = pLimit(CONCORRENCIA);

<<<<<<< HEAD
  const resultados = Promise.all(
    fileEntries.map(entry =>
      limit(() => {
=======
  const resultados = await Promise.all(
    fileEntries.map(entry =>
      limit(async () => {
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
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