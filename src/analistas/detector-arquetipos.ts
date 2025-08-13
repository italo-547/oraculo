import { ARQUETIPOS, normalizarCaminho } from './arquetipos-defs.js';
import { grafoDependencias } from './detector-dependencias.js';
import type {
  ContextoExecucao,
  ResultadoDeteccaoArquetipo,
  ArquetipoDeteccaoAnomalia,
  SnapshotEstruturaBaseline,
  ArquetipoEstruturaDef,
} from '../tipos/tipos.js';
import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';
import path from 'node:path';

function scoreArquetipo(
  def: ArquetipoEstruturaDef,
  arquivos: string[],
): ResultadoDeteccaoArquetipo {
  const norm = arquivos.map(normalizarCaminho);
  const required = def.requiredDirs || [];
  const matchedRequired = required.filter((d) =>
    norm.some((f) => f.startsWith(d + '/') || f === d),
  );
  const missingRequired = required.filter((d) => !matchedRequired.includes(d));
  const optional = def.optionalDirs || [];
  const matchedOptional = optional.filter((d) =>
    norm.some((f) => f.startsWith(d + '/') || f === d),
  );
  const dependencyMatches = (def.dependencyHints || []).filter((dep) => grafoDependencias.has(dep));
  const filePatternMatches = (def.filePresencePatterns || []).filter((pat) =>
    norm.some((f) => f.includes(pat)),
  );
  const forbiddenPresent = (def.forbiddenDirs || []).filter((d) =>
    norm.some((f) => f.startsWith(d + '/') || f === d),
  );
  // Score heurístico
  let score = (def.pesoBase || 1) * 10;
  score += matchedRequired.length * 15;
  score -= missingRequired.length * 20; // penaliza forte
  score += matchedOptional.length * 5;
  score += dependencyMatches.length * 8;
  score += filePatternMatches.length * 6;
  score -= forbiddenPresent.length * 10;
  if (score < 0) score = 0;
  const maxPossible =
    (def.pesoBase || 1) * 10 +
    required.length * 15 +
    optional.length * 5 +
    (def.dependencyHints || []).length * 8 +
    (def.filePresencePatterns || []).length * 6;
  const confidence = maxPossible > 0 ? Math.min(100, Math.round((score / maxPossible) * 100)) : 0;

  // Anomalias básicas: arquivos na raiz não permitidos
  const raizFiles = norm.filter((p) => !p.includes('/'));
  const allowed = new Set([...(def.rootFilesAllowed || [])]);
  const anomalias: ArquetipoDeteccaoAnomalia[] = [];
  for (const rf of raizFiles) {
    if (rf && rf.trim() !== '' && !allowed.has(rf)) {
      anomalias.push({ path: rf, motivo: 'Arquivo na raiz não permitido para este arquétipo' });
    }
  }

  return {
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
    anomalias,
    planoSugestao: { mover: [] },
  };
}

export interface ResultadoBibliotecaArquetipos {
  melhores: ResultadoDeteccaoArquetipo[];
  baseline?: SnapshotEstruturaBaseline;
}

export async function detectarArquetipos(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  baseDir: string,
): Promise<ResultadoBibliotecaArquetipos> {
  const arquivos = contexto.arquivos.map((f) => f.relPath);
  const resultados = ARQUETIPOS.map((a) => scoreArquetipo(a, arquivos));
  resultados.sort((a, b) => b.confidence - a.confidence || b.score - a.score);
  const topConfidence = resultados[0]?.confidence || 0;
  const melhores = resultados.filter((r) => topConfidence - r.confidence <= 10).slice(0, 3);
  const baselinePath = path.join(baseDir, '.oraculo', 'baseline-estrutura.json');
  let baseline: SnapshotEstruturaBaseline | undefined;
  const existente = await lerEstado<SnapshotEstruturaBaseline | []>(baselinePath);
  if (
    existente &&
    !Array.isArray(existente) &&
    typeof existente === 'object' &&
    'arquetipo' in existente
  ) {
    baseline = existente as SnapshotEstruturaBaseline;
  }
  if (!baseline && melhores[0]) {
    baseline = {
      version: 1,
      timestamp: new Date().toISOString(),
      arquetipo: melhores[0].nome,
      confidence: melhores[0].confidence,
      arquivosRaiz: arquivos.filter((p) => !p.includes('/')).sort(),
    };
    await salvarEstado(baselinePath, baseline);
  }
  return { melhores, baseline };
}
