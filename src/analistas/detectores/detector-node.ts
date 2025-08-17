import type { ResultadoDeteccaoArquetipo, ArquetipoEstruturaDef } from '@tipos/tipos.js';
import { ARQUETIPOS, normalizarCaminho } from '../arquetipos-defs.js';
import { grafoDependencias } from '../detector-dependencias.js';

/**
 * Detector especializado para projetos Node.js/TypeScript
 * Retorna lista de candidatos de arquétipo com score/confiança
 */
export function detectarArquetipoNode(arquivos: string[]): ResultadoDeteccaoArquetipo[] {
  const norm = arquivos.map((f) => String(normalizarCaminho(f)));
  const candidatos: ResultadoDeteccaoArquetipo[] = [];
  for (const def of ARQUETIPOS) {
    // Filtro: só analisa arquétipos Node/TS (exemplo: tem package.json ou src/)
    if (norm.includes('package.json') || norm.some((f) => f.startsWith('src/') || f === 'src')) {
      const required = def.requiredDirs || [];
      const matchedRequired = required.filter((d) =>
        norm.some((f) => f.startsWith(d + '/') || f === d),
      );
      const missingRequired = required.filter((d) => !matchedRequired.includes(d));
      const optional = def.optionalDirs || [];
      const matchedOptional = optional.filter((d) =>
        norm.some((f) => f.startsWith(d + '/') || f === d),
      );
      const dependencyMatches = (def.dependencyHints || []).filter((dep) =>
        grafoDependencias.has(dep),
      );
      const filePatternMatches = (def.filePresencePatterns || []).filter((pat) =>
        norm.some((f) => f.includes(pat)),
      );
      const forbiddenPresent = (def.forbiddenDirs || []).filter((d) =>
        norm.some((f) => f.startsWith(d + '/') || f === d),
      );
      let score = (def.pesoBase || 1) * 10;
      score += matchedRequired.length * 10;
      score -= missingRequired.length * 20;
      score += matchedOptional.length * 5;
      score += dependencyMatches.length * 10;
      score += filePatternMatches.length * 5;
      score -= forbiddenPresent.length * 20;
      // Confiança: simples, proporcional ao score
      const confidence = Math.max(0, Math.min(100, score * 2));
      candidatos.push({
        nome: def.nome,
        descricao: def.descricao,
        score,
        confidence,
        matchedRequired,
        missingRequired,
        matchedOptional,
        dependencyMatches,
        filePatternMatches,
        forbiddenPresent,
        anomalias: [],
      });
    }
  }
  return candidatos;
}
