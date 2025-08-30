// SPDX-License-Identifier: MIT
import path from 'node:path';
import pLimit from 'p-limit';
import { config } from '../nucleo/constelacao/cosmos.js';
/**
 * Exportado apenas para testes. Não usar fora de testes!
 */
export const CAMADAS = {};
const CONCORRENCIA = typeof config.AUTOANALISE_CONCURRENCY === 'number' ? config.AUTOANALISE_CONCURRENCY : 5;
export async function analisarEstrutura(fileEntries, _baseDir = process.cwd()) {
    const limit = pLimit(CONCORRENCIA);
    const resultados = await Promise.all(fileEntries.map((entry) => limit(() => {
        const rel = entry.relPath;
        // Normaliza para separador POSIX para evitar dependência de platform e necessidade de mock em testes
        const normalizado = rel.replace(/\\/g, '/');
        const atual = normalizado.split('/')[0] || '';
        let ideal = null;
        const matchDireta = Object.entries(CAMADAS).find(([, dir]) => normalizado.startsWith(dir.replace(/\\/g, '/') + '/'));
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
//# sourceMappingURL=analista-estrutura.js.map