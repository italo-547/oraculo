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

const PENALIDADE_MISSING_REQUIRED = 20;
const PESO_OPTIONAL = 5;
const PESO_REQUIRED = 10;
const PESO_DEPENDENCIA = 10;
const PESO_PATTERN = 5;
const PENALIDADE_FORBIDDEN = 20;

function scoreArquetipo(
  def: ArquetipoEstruturaDef,
  arquivos: string[],
): ResultadoDeteccaoArquetipo {
  const norm = arquivos.map((f) => String(normalizarCaminho(f)));
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

  let score = (def.pesoBase || 1) * 10;
  score += matchedRequired.length * PESO_REQUIRED;
  score -= missingRequired.length * PENALIDADE_MISSING_REQUIRED;
  score += matchedOptional.length * PESO_OPTIONAL;
  score += dependencyMatches.length * PESO_DEPENDENCIA;
  score += filePatternMatches.length * PESO_PATTERN;
  score -= forbiddenPresent.length * PENALIDADE_FORBIDDEN;

  const temControllers = matchedRequired.includes('src/controllers');
  const temExpress = dependencyMatches.includes('express');
  let explicacaoSimilaridade = '';
  if (def.nome === 'api-rest-express') {
    if (temControllers && temExpress) {
      score += 50;
    } else if (temControllers) {
      score += 25;
    } else if (temExpress) {
      score += 15;
    }
    if (norm.some((f) => /api|rest/i.test(f))) {
      score += 10;
    }
    if (score >= 100) {
      explicacaoSimilaridade = 'Estrutura segue o padrão oficial api-rest-express.';
    } else if (score >= 70) {
      explicacaoSimilaridade =
        'Estrutura se assemelha fortemente ao padrão api-rest-express, mas há diferenças. Recomenda-se revisar nomes de diretórios, dependências e rotas.';
    } else if (score >= 40) {
      explicacaoSimilaridade =
        'Estrutura parcialmente compatível com api-rest-express. Recomenda-se padronizar src/controllers, dependência express e rotas api/rest.';
    } else {
      explicacaoSimilaridade =
        'Estrutura personalizada, mas o padrão mais próximo é api-rest-express. Recomenda-se seguir boas práticas para facilitar manutenção.';
    }
  }

  let candidatoExtra: string | undefined;
  if (def.nome === 'fullstack') {
    const temPages = matchedRequired.includes('pages');
    const temApi = matchedRequired.includes('api');
    const temPrisma = matchedRequired.includes('prisma');
    const temControllers = norm.some((f) => f.includes('src/controllers'));
    const temExpress = grafoDependencias.has('express');
    let isHibridoCompleto = temPages && temApi && temPrisma && temControllers && temExpress;
    let isHibridoParcial = temPages && temApi && temPrisma && (temControllers || temExpress);
    if (isHibridoCompleto) {
      score += 40;
      explicacaoSimilaridade =
        'Estrutura híbrida: fullstack + api-rest-express. Projeto combina frontend (pages/api/prisma) e backend Express/controllers.';
      candidatoExtra = 'api-rest-express';
      // Garante que a explicação sempre inclua os candidatos potenciais
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    } else if (temPages && temApi && temPrisma) {
      score += 20;
      explicacaoSimilaridade = 'Estrutura segue o padrão fullstack (pages/api/prisma).';
      // Sempre inclui candidatos potenciais quando fullstack detectado
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    }
  }

  // Reforça score/confiança do candidato extra em cenários híbridos (fullstack + api-rest-express)
  if (def.nome === 'api-rest-express' && grafoDependencias.has('express')) {
    if (
      norm.some((f) => f.includes('pages')) &&
      norm.some((f) => f.includes('prisma')) &&
      norm.some((f) => f.includes('api'))
    ) {
      score += 40;
      if (score > 100) score = 100;
      explicacaoSimilaridade =
        'Estrutura híbrida: api-rest-express + fullstack. Projeto combina backend Express/controllers e frontend (pages/prisma/api).';
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    }
    // Se chamado como candidatoExtra de fullstack híbrido, reforça score
    else if (norm.some((f) => f.includes('pages')) && norm.some((f) => f.includes('prisma'))) {
      score += 40;
      if (score > 100) score = 100;
      explicacaoSimilaridade =
        'Estrutura híbrida: api-rest-express + fullstack. Projeto combina backend Express/controllers e frontend (pages/prisma).';
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    }
  }

  if (score < 0) score = 0;
  const maxPossible =
    (def.pesoBase || 1) * 10 +
    (def.requiredDirs?.length || 0) * PESO_REQUIRED +
    (def.optionalDirs?.length || 0) * PESO_OPTIONAL +
    (def.dependencyHints?.length || 0) * PESO_DEPENDENCIA +
    (def.filePresencePatterns?.length || 0) * PESO_PATTERN +
    30;
  const confidence = maxPossible > 0 ? Math.min(100, Math.round((score / maxPossible) * 100)) : 0;

  const raizFiles = norm.filter((p) => typeof p === 'string' && !p.includes('/'));
  const allowed = new Set([...(def.rootFilesAllowed || [])]);
  let anomalias: ArquetipoDeteccaoAnomalia[] = [];
  for (const rf of raizFiles) {
    if (typeof rf === 'string' && rf.trim() !== '' && !allowed.has(rf)) {
      anomalias.push({ path: rf, motivo: 'Arquivo na raiz não permitido para este arquétipo' });
    }
  }
  let sugestaoPadronizacao = '';
  if (def.nome === 'api-rest-express') {
    if (!matchedRequired.includes('src/controllers')) {
      sugestaoPadronizacao +=
        'Sugestão: adicione o diretório src/controllers para seguir o padrão api-rest-express.\n';
    }
    if (!dependencyMatches.includes('express')) {
      sugestaoPadronizacao +=
        'Sugestão: adicione express nas dependências para seguir o padrão api-rest-express.\n';
    }
    if (!norm.some((f) => /api|rest/i.test(f))) {
      sugestaoPadronizacao +=
        'Sugestão: utilize nomes de arquivos e rotas que incluam "api" ou "rest" para reforçar o padrão.\n';
    }
  }
  // Retorna candidatoExtra junto ao resultado (usado só internamente)
  return {
    nome: def.nome,
    score,
    confidence,
    matchedRequired,
    missingRequired,
    matchedOptional,
    dependencyMatches,
    filePatternMatches,
    forbiddenPresent,
    anomalias,
    sugestaoPadronizacao,
    explicacaoSimilaridade,
    descricao: def.descricao || '',
    candidatoExtra,
  };
}

export async function detectarArquetipos(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  baseDir: string,
): Promise<{
  melhores: ResultadoDeteccaoArquetipo[];
  baseline?: SnapshotEstruturaBaseline;
  drift?: ArquetipoDrift;
}> {
  const arquivos = contexto.arquivos.map((f) => f.relPath);
  // Calcula score para cada stack/arquetipo e armazena em objeto
  const resultados: ResultadoDeteccaoArquetipo[] = [];
  for (const def of ARQUETIPOS) {
    const resultado = scoreArquetipo(def, arquivos);
    resultados.push(resultado);
    // Se houver candidatoExtra, calcula também e adiciona ao array
    if (resultado.candidatoExtra) {
      const defExtra = ARQUETIPOS.find((a) => a.nome === resultado.candidatoExtra);
      if (defExtra) {
        const extra = scoreArquetipo(defExtra, arquivos);
        // Evita duplicidade pelo nome
        if (!resultados.some((r) => r.nome === extra.nome)) {
          resultados.push(extra);
        }
      }
    }
  }
  // Ordena por confiança e score
  resultados.sort((a, b) => b.confidence - a.confidence || b.score - a.score);
  // Seleciona todos os stacks com confiança >= 40 (ajustável)
  const LIMIAR_CONFIANCA = 40;
  let candidatosPotenciais: ResultadoDeteccaoArquetipo[] = resultados.filter(
    (r) => r.confidence >= LIMIAR_CONFIANCA,
  );
  // Se nenhum passou do limiar, retorna o melhor disponível
  if (candidatosPotenciais.length === 0 && resultados.length > 0) {
    candidatosPotenciais = [resultados[0]];
  }
  // Agrupa por nome e conta votos
  const votos: Record<string, number> = {};
  for (const c of candidatosPotenciais) {
    votos[c.nome] = (votos[c.nome] || 0) + 1;
  }
  // Seleciona o mais votado (sem empate)
  let escolhido: ResultadoDeteccaoArquetipo | undefined;
  let maxVotos = 0;
  for (const nome in votos) {
    if (votos[nome] > maxVotos) {
      maxVotos = votos[nome];
      escolhido = candidatosPotenciais.find((c) => c.nome === nome);
    }
  }
  // Lista os demais candidatos potenciais (menos votados)
  const outrosCandidatos = candidatosPotenciais.filter((c) => c.nome !== (escolhido?.nome ?? ''));
  // Adiciona explicação sobre candidatos potenciais
  if (escolhido) {
    escolhido.explicacaoSimilaridade +=
      outrosCandidatos.length > 0
        ? `\nOutros candidatos potenciais detectados: ${outrosCandidatos.map((c) => c.nome).join(', ')}.`
        : '';
  }
  // Exporta apenas o mais votado
  const melhores: ResultadoDeteccaoArquetipo[] = escolhido ? [escolhido] : [];
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
  let drift: ArquetipoDrift | undefined;
  if (baseline && melhores[0]) {
    const atual = melhores[0];
    const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/')).sort();
    const setBase = new Set(baseline.arquivosRaiz);
    const setAtual = new Set(arquivosRaizAtuais);
    const novos: string[] = [];
    const removidos: string[] = [];
    for (const f of setAtual) if (!setBase.has(f)) novos.push(f as string);
    for (const f of setBase) if (!setAtual.has(f)) removidos.push(f as string);
    drift = {
      alterouArquetipo: baseline.arquetipo !== atual.nome,
      anterior: baseline.arquetipo,
      atual: atual.nome,
      deltaConfidence: atual.confidence - baseline.confidence,
      arquivosRaizNovos: novos,
      arquivosRaizRemovidos: removidos,
    };
  }
  if (melhores[0]) {
    const top = melhores[0];
    try {
      const { plano } = await OperarioEstrutura.planejar(baseDir, contexto.arquivos, {
        preferEstrategista: true,
      });
      if (plano) top.planoSugestao = plano;
    } catch {
      // mantém default vazio se falhar
    }
  }
  return { melhores, baseline, drift };
}
