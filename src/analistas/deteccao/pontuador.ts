// SPDX-License-Identifier: MIT
import { ARQUETIPOS, normalizarCaminho } from '../arquetipos-defs.js';
import { grafoDependencias } from '../detector-dependencias.js';
import type {
  ResultadoDeteccaoArquetipo,
  ArquetipoEstruturaDef,
  ArquetipoDeteccaoAnomalia,
} from '../../tipos/tipos.js';

const PENALIDADE_MISSING_REQUIRED = 20;
const PESO_OPTIONAL = 5;
const PESO_REQUIRED = 10;
const PESO_DEPENDENCIA = 10;
const PESO_PATTERN = 5;
const PENALIDADE_FORBIDDEN = 20;

export function scoreArquetipo(
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
  // Verifica dependências sugeridas no grafo global (qualquer arquivo pode importar)
  // Otimização: materializa um Set único de todas as dependências para lookup O(1)
  const allDependencies = new Set<string>();
  for (const set of grafoDependencias.values()) {
    for (const dep of set) {
      allDependencies.add(dep);
    }
  }
  function hasDependencyGlobal(dep: string): boolean {
    return allDependencies.has(dep);
  }
  const dependencyMatches = (def.dependencyHints || []).filter((dep) => hasDependencyGlobal(dep));
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

  let explicacaoSimilaridade = '';
  let candidatoExtra: string | undefined;

  if (def.nome === 'fullstack') {
    const temPages = matchedRequired.includes('pages');
    const temApi = matchedRequired.includes('api');
    const temPrisma = matchedRequired.includes('prisma');
    const temControllers = norm.some((f) => f.includes('src/controllers'));
    const temExpress = grafoDependencias.has('express');
    const isHibridoCompleto = temPages && temApi && temPrisma && temControllers && temExpress;
    if (isHibridoCompleto) {
      score += 40;
      explicacaoSimilaridade =
        'Estrutura híbrida: fullstack + api-rest-express. Projeto combina frontend (pages/api/prisma) e backend Express/controllers.';
      candidatoExtra = 'api-rest-express';
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    } else if (temPages && temApi && temPrisma) {
      score += 20;
      explicacaoSimilaridade = 'Estrutura segue o padrão fullstack (pages/api/prisma).';
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    }
  }

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
    } else if (norm.some((f) => f.includes('pages')) && norm.some((f) => f.includes('prisma'))) {
      score += 40;
      if (score > 100) score = 100;
      explicacaoSimilaridade =
        'Estrutura híbrida: api-rest-express + fullstack. Projeto combina backend Express/controllers e frontend (pages/prisma).';
      explicacaoSimilaridade +=
        '\nOutros candidatos potenciais detectados: fullstack, api-rest-express.';
    }
  }

  if (def.nome === 'api-rest-express') {
    const temControllers = matchedRequired.includes('src/controllers');
    const temExpress = dependencyMatches.includes('express');
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

  // Explicação genérica quando há penalidades/ausências e ainda não foi preenchida
  if (!explicacaoSimilaridade) {
    const partes: string[] = [];
    if (missingRequired.length > 0) {
      partes.push(`Diretórios obrigatórios ausentes/faltantes: ${missingRequired.join(', ')}.`);
    }
    if (forbiddenPresent.length > 0) {
      partes.push(`Diretórios não permitidos/proibidos presentes: ${forbiddenPresent.join(', ')}.`);
    }
    if (partes.length > 0) {
      explicacaoSimilaridade = `${partes.join(' ')} Estrutura parcialmente compatível, personalizada ou com diferenças.`;
    }
  }

  // Importante: manter score negativo quando penalidades superam acertos,
  // pois alguns testes validam score <= 0 para cenários de penalização.
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

export function pontuarTodos(arquivos: string[]): ResultadoDeteccaoArquetipo[] {
  const resultados: ResultadoDeteccaoArquetipo[] = [];
  for (const def of ARQUETIPOS) {
    const r = scoreArquetipo(def, arquivos);
    resultados.push(r);
    if (r.candidatoExtra) {
      const extra = ARQUETIPOS.find((a) => a.nome === r.candidatoExtra);
      if (extra) {
        const e = scoreArquetipo(extra, arquivos);
        if (!resultados.some((x) => x.nome === e.nome)) resultados.push(e);
      }
    }
  }
  // Filtro: manter apenas candidatos que apresentem algum sinal (match/forbidden/pattern/dep)
  return resultados.filter(
    (r) =>
      (r.matchedRequired?.length || 0) > 0 ||
      (r.matchedOptional?.length || 0) > 0 ||
      (r.dependencyMatches?.length || 0) > 0 ||
      (r.filePatternMatches?.length || 0) > 0 ||
      (r.forbiddenPresent?.length || 0) > 0,
  );
}
