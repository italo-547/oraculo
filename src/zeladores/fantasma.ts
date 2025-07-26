import { scanRepository } from '../nucleo/scanner.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { grafoDependencias } from '../analistas/detector-dependencias.js';

import type { ArquivoFantasma, FileMap } from '../tipos/tipos.js';

const EXTENSOES_ALVO = ['.js', '.ts', '.jsx', '.tsx'];
const IGNORAR_PADROES = ['test', 'mock', 'spec', 'stories'];
const INATIVIDADE_DIAS = Number(process.env.GHOST_DAYS) || 30;
const MILIS_POR_DIA = 86_400_000;

function estaSendoReferenciado(relPath: string, grafo: Map<string, Set<string>>): boolean {
  for (const dependencias of grafo.values()) {
    if (dependencias.has(relPath)) return true;
  }
  return false;
}

export async function detectarFantasmas(
  baseDir: string = process.cwd()
): Promise<{ total: number; fantasmas: ArquivoFantasma[] }> {
  const fileMap: FileMap = await scanRepository(baseDir);
  const agora = Date.now();
  const fantasmas: ArquivoFantasma[] = [];

  for (const entrada of Object.values(fileMap)) {
    const { relPath, fullPath } = entrada;
    const ext = path.extname(relPath).toLowerCase();

    if (!EXTENSOES_ALVO.includes(ext)) continue;
    if (IGNORAR_PADROES.some(p => relPath.toLowerCase().includes(p))) continue;

    try {
      const stat = await fs.stat(fullPath);
      const diasInativo = Math.floor((agora - stat.mtimeMs) / MILIS_POR_DIA);
      const referenciado = estaSendoReferenciado(relPath, grafoDependencias);

      if (!referenciado || diasInativo > INATIVIDADE_DIAS) {
        fantasmas.push({
          arquivo: relPath,
          referenciado,
          diasInativo
        });
      }
    } catch {
      // Arquivo inacessível, ignorado silenciosamente
    }
  }

  return {
    total: fantasmas.length,
    fantasmas
  };
}