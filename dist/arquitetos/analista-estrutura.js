import path from 'node:path';
import pLimit from 'p-limit';
import { config } from '../nucleo/constelacao/cosmos.js';
// TODO: Definir camadas de estrutura conforme necessidade do projeto
const CAMADAS = {};
const CONCORRENCIA = config.AUTOANALISE_CONCURRENCY ?? 5;
export async function analisarEstrutura(fileEntries, _baseDir = process.cwd()) {
    const limit = pLimit(CONCORRENCIA);
    const resultados = await Promise.all(fileEntries.map(entry => limit(async () => {
        const rel = entry.relPath;
        const atual = rel.split(path.sep)[0] || '';
        let ideal = null;
        const matchDireta = Object.entries(CAMADAS).find(([, dir]) => rel.startsWith(dir + path.sep));
        if (matchDireta) {
            ideal = matchDireta[1];
        }
        else {
            const nome = path.basename(rel);
            const [, tipo] = /\.([^.]+)\.[^.]+$/.exec(nome) ?? [];
            if (tipo && CAMADAS[tipo]) {
                ideal = CAMADAS[tipo];
            }
        }
        return { arquivo: rel, atual, ideal };
    })));
    return resultados;
}
export { analisarEstrutura as alinhamentoEstrutural };
