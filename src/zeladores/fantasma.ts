import { scanRepository } from '../nucleo/scanner.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { grafoDependencias } from '../analistas/detector-dependencias.js';
const EXTENSOES_ALVO = ['.js', '.ts', '.jsx', '.tsx'];
const IGNORAR_PADROES = ['test', 'mock', 'spec', 'stories'];
const INATIVIDADE_DIAS = Number(process.env.GHOST_DAYS) || 30;
const MILIS_POR_DIA = 86_400_000;
function estaSendoReferenciado(relPath, grafo) {
    for (const dependencias of grafo.values()) {
        if (dependencias.has(relPath))
            return true;
    }
    return false;
}
export async function detectarFantasmas(baseDir = process.cwd()) {
    const fileMap = await scanRepository(baseDir);
    const agora = Date.now();
    const fantasmas = [];
    for (const entrada of Object.values(fileMap)) {
        const { relPath, fullPath } = entrada;
        const ext = path.extname(relPath).toLowerCase();
        if (!EXTENSOES_ALVO.includes(ext))
            continue;
        if (IGNORAR_PADROES.some(p => relPath.toLowerCase().includes(p)))
            continue;
        try {
            const stat = await fs.stat(fullPath);
            const diasInativo = Math.floor((agora - stat.mtimeMs) / MILIS_POR_DIA);
            const referenciado = estaSendoReferenciado(relPath, grafoDependencias);
            if (!referenciado || diasInativo > INATIVIDADE_DIAS) {
                fantasmas.push({
                    arquivo: relPath,
                    tamanho: stat.size,
                    modificado: new Date(stat.mtimeMs).toISOString(),
                    referenciado,
                    diasInativo
                });
            }
        }
        catch {
            // Silencia arquivos inacessíveis
        }
    }
    return {
        total: fantasmas.length,
        fantasmas
    };
}
