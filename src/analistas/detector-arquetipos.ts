import { ARQUETIPOS, normalizarCaminho } from './arquetipos-defs.js';
import { grafoDependencias } from './detector-dependencias.js';
import type {
  ContextoExecucao,
  ResultadoDeteccaoArquetipo,
  ArquetipoDeteccaoAnomalia,
  SnapshotEstruturaBaseline,
  ArquetipoEstruturaDef,
  ArquetipoDrift,
} from '../tipos/tipos.js';
import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';
import { OperarioEstrutura } from '../zeladores/operario-estrutura.js';
import path from 'node:path';

// Pesos e limites centralizados (evita números mágicos espalhados)
const PESO_REQUIRED = 15;
const PENALIDADE_MISSING_REQUIRED = 20;
const PESO_OPTIONAL = 5;
const PESO_DEPENDENCIA = 8;
const PESO_PATTERN = 6;
const PENALIDADE_FORBIDDEN = 10;

// (Regex antigos removidos por não uso — ver histórico caso necessário restaurar)

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
  score += matchedRequired.length * PESO_REQUIRED;
  score -= missingRequired.length * PENALIDADE_MISSING_REQUIRED; // penaliza forte ausência
  score += matchedOptional.length * PESO_OPTIONAL;
  score += dependencyMatches.length * PESO_DEPENDENCIA;
  score += filePatternMatches.length * PESO_PATTERN;
  score -= forbiddenPresent.length * PENALIDADE_FORBIDDEN;
  if (score < 0) score = 0;
  const maxPossible =
    (def.pesoBase || 1) * 10 +
    required.length * PESO_REQUIRED +
    optional.length * PESO_OPTIONAL +
    (def.dependencyHints || []).length * PESO_DEPENDENCIA +
    (def.filePresencePatterns || []).length * PESO_PATTERN;
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
    planoSugestao: { mover: [], conflitos: [], resumo: { total: 0, zonaVerde: 0, bloqueados: 0 } },
  };
}

export interface ResultadoBibliotecaArquetipos {
  melhores: ResultadoDeteccaoArquetipo[];
  baseline?: SnapshotEstruturaBaseline;
  drift?: ArquetipoDrift;
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
  // Calcular drift se baseline existe
  let drift: ArquetipoDrift | undefined;
  if (baseline && melhores[0]) {
    const atual = melhores[0];
    const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/')).sort();
    const setBase = new Set(baseline.arquivosRaiz);
    const setAtual = new Set(arquivosRaizAtuais);
    const novos: string[] = [];
    const removidos: string[] = [];
    for (const f of setAtual) if (!setBase.has(f)) novos.push(f);
    for (const f of setBase) if (!setAtual.has(f)) removidos.push(f);
    drift = {
      alterouArquetipo: baseline.arquetipo !== atual.nome,
      anterior: baseline.arquetipo,
      atual: atual.nome,
      deltaConfidence: atual.confidence - baseline.confidence,
      arquivosRaizNovos: novos,
      arquivosRaizRemovidos: removidos,
    };
  }
  // Geração de planoSugestao centralizada via Operário (apenas para o top)
  if (melhores[0]) {
    const top = melhores[0];
    try {
      const { plano } = await OperarioEstrutura.planejar(
        baseDir,
        contexto.arquivos,
        { preferEstrategista: true }, // evita recursão e usa núcleo unificado
      );
      if (plano) top.planoSugestao = plano;
    } catch {
      // mantém default vazio se falhar
    }
  }
  return { melhores, baseline, drift };
}
