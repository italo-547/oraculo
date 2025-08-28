// SPDX-License-Identifier: MIT
// Nota: manter ARQUETIPOS importado visível como lembrete para integração futura
import { ARQUETIPOS, normalizarCaminho } from './arquetipos-defs.js';
// Referência intencional para evitar remoção/aviso de import mantido como lembrete
void ARQUETIPOS;
import { grafoDependencias } from './detector-dependencias.js';
import {
  extrairSinaisAvancados,
  SinaisProjetoAvancados,
} from '../arquitetos/sinais-projeto-avancados.js';
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

// Função principal de pontuação e decisão de arquétipo.
// Agora implementa lógica de votação: prioriza dominante, classifica como misto em caso de empate, e desconhecido se nenhum padrão relevante.
// Integração futura com orquestrador pode ser feita aqui, se necessário.
function scoreArquetipo(
  def: ArquetipoEstruturaDef,
  arquivos: string[],
  sinaisAvancados: SinaisProjetoAvancados,
): ResultadoDeteccaoArquetipo {
  const norm = arquivos.map((f) => String(normalizarCaminho(f)));
  // Verifica se alguma entrada do grafo contém a dependência informada
  function hasDependency(dep: string): boolean {
    for (const set of grafoDependencias.values()) {
      if (set.has(dep)) return true;
    }
    return false;
  }
  const required = def.requiredDirs || [];
  const matchedRequired = required.filter((d) =>
    norm.some((f) => f.startsWith(d + '/') || f === d),
  );
  const missingRequired = required.filter((d) => !matchedRequired.includes(d));
  // Bônus extra: se todos os requisitos oficiais estão presentes, favorece arquétipos específicos
  let bonusEspecificidade = 0;
  let penalidadeGenérico = 0;
  // Se todos os requisitos obrigatórios estão presentes, aplica bônus e penaliza genéricos para garantir que o específico seja priorizado
  if (required.length > 0 && missingRequired.length === 0) {
    const pesoBase = typeof def.pesoBase === 'number' ? def.pesoBase : 1;
    bonusEspecificidade = pesoBase > 1 ? 200 : 120;
    // Penaliza fortemente genéricos se outro específico está completo (evita falsos positivos)
    if (def.nome === 'cli-modular' || def.nome === 'fullstack' || def.nome === 'landing-page') {
      penalidadeGenérico = 1000; // penalidade extrema para nunca ultrapassar específico
    }
  }
  const optional = def.optionalDirs || [];
  const matchedOptional = optional.filter((d) =>
    norm.some((f) => f.startsWith(d + '/') || f === d),
  );
  const dependencyMatches = (def.dependencyHints || []).filter((dep) => hasDependency(dep));
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
  score += bonusEspecificidade;
  score -= penalidadeGenérico;

  // Enriquecimento heurístico: ajusta score conforme sinais avançados do projeto
  let explicacaoSinais = '';
  if (sinaisAvancados) {
    // 1. Funções
    if (sinaisAvancados.funcoes > 10) {
      score += 10;
      explicacaoSinais += `Detectado ${sinaisAvancados.funcoes} funções declaradas.\n`;
    }
    // 2. Imports
    if (sinaisAvancados.imports.length > 0) {
      score += Math.min(10, sinaisAvancados.imports.length);
      explicacaoSinais += `Imports detectados: ${sinaisAvancados.imports.join(', ')}.\n`;
    }
    // 3. Variáveis
    if (sinaisAvancados.variaveis > 10) {
      score += 5;
      explicacaoSinais += `Detectado ${sinaisAvancados.variaveis} variáveis declaradas.\n`;
    }
    // 4. Tipos
    if (sinaisAvancados.tipos.length > 0) {
      score += Math.min(10, sinaisAvancados.tipos.length);
      explicacaoSinais += `Tipos/Interfaces detectados: ${sinaisAvancados.tipos.join(', ')}.\n`;
    }
    // 5. Classes
    if (sinaisAvancados.classes > 0) {
      score += Math.min(10, sinaisAvancados.classes);
      explicacaoSinais += `Detectado ${sinaisAvancados.classes} classes declaradas.\n`;
    }
    // 6. Frameworks detectados
    if (sinaisAvancados.frameworksDetectados.length > 0) {
      score += sinaisAvancados.frameworksDetectados.length * 5;
      explicacaoSinais += `Frameworks detectados: ${sinaisAvancados.frameworksDetectados.join(', ')}.\n`;
    }
    // 7. Dependências
    if (sinaisAvancados.dependencias.length > 0) {
      score += Math.min(10, sinaisAvancados.dependencias.length);
      explicacaoSinais += `Dependências detectadas: ${sinaisAvancados.dependencias.join(', ')}.\n`;
    }
    // Scripts
    if (sinaisAvancados.scripts.length > 0) {
      score += Math.min(5, sinaisAvancados.scripts.length);
      explicacaoSinais += `Scripts detectados: ${sinaisAvancados.scripts.join(', ')}.\n`;
    }
    // Pastas padrão
    if (sinaisAvancados.pastasPadrao.length > 0) {
      score += Math.min(10, sinaisAvancados.pastasPadrao.length);
      explicacaoSinais += `Pastas padrão detectadas: ${sinaisAvancados.pastasPadrao.join(', ')}.\n`;
    }
    // Arquivos padrão
    if (sinaisAvancados.arquivosPadrao.length > 0) {
      score += Math.min(10, sinaisAvancados.arquivosPadrao.length);
      explicacaoSinais += `Arquivos padrão detectados: ${sinaisAvancados.arquivosPadrao.join(', ')}.\n`;
    }
    // Arquivos de configuração
    if (sinaisAvancados.arquivosConfig.length > 0) {
      score += Math.min(5, sinaisAvancados.arquivosConfig.length);
      explicacaoSinais += `Arquivos de configuração detectados: ${sinaisAvancados.arquivosConfig.join(', ')}.\n`;
    }
  }

  const temControllers = matchedRequired.includes('src/controllers');
  const temExpress = dependencyMatches.includes('express');
  let explicacaoSimilaridade = explicacaoSinais;
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
    const temExpress = hasDependency('express');
    let isHibridoCompleto = temPages && temApi && temPrisma && temControllers && temExpress;
    // Nota: variável mantida para futura heurística (parcial vs completo)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  if (def.nome === 'api-rest-express' && hasDependency('express')) {
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

// Exposição somente para testes (não altera API pública)
// Evita exportar diretamente para não vazar em produção
if (process.env.VITEST) {
  type TestExports = Record<string, unknown> & { scoreArquetipo: typeof scoreArquetipo };
  const g = globalThis as unknown as { __ORACULO_TESTS__?: TestExports };
  const prev = g.__ORACULO_TESTS__ ?? ({} as TestExports);
  g.__ORACULO_TESTS__ = { ...prev, scoreArquetipo };
}

export async function detectarArquetipos(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  baseDir: string,
): Promise<{
  candidatos: ResultadoDeteccaoArquetipo[];
  baseline?: SnapshotEstruturaBaseline;
  drift?: ArquetipoDrift;
}> {
  const arquivos = contexto.arquivos.map((f) => f.relPath);
  // Extrai sinais avançados do projeto
  const sinaisAvancados = extrairSinaisAvancados(
    contexto.arquivos,
    await lerEstado(path.join(baseDir, 'package.json')),
    undefined,
    baseDir,
    arquivos,
  );
  // Pontua todos os arquétipos disponíveis usando sinais avançados
  let candidatos = ARQUETIPOS.map((def) => scoreArquetipo(def, arquivos, sinaisAvancados));
  // Ordena por confiança/score decrescente
  candidatos.sort((a, b) => b.confidence - a.confidence || b.score - a.score);

  // Decisão final: dominante, misto ou desconhecido
  // - Dominante: score/confiança muito superior
  // - Misto: múltiplos com scores próximos
  // - Desconhecido: nenhum padrão relevante
  const scoresValidos = candidatos.filter((c) => c.confidence >= 30);
  if (!scoresValidos.length) {
    // Nenhum padrão relevante
    candidatos = [
      {
        nome: 'desconhecido',
        score: 0,
        confidence: 0,
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: 'Nenhum arquétipo identificado.',
        descricao: 'Nenhum arquétipo identificado.',
      },
    ];
  } else {
    // Se há múltiplos com scores próximos, classifica como misto
    const top = scoresValidos[0];
    const proximos = scoresValidos.filter(
      (c) => c !== top && Math.abs(c.confidence - top.confidence) <= 10,
    );
    if (proximos.length > 0) {
      candidatos = [
        {
          nome: 'misto',
          score: top.score,
          confidence: top.confidence,
          matchedRequired: [],
          missingRequired: [],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: [],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: `Estrutura mista: sinais de múltiplos arquétipos (${[top.nome, ...proximos.map((p) => p.nome)].join(', ')}).`,
          descricao: 'Estrutura mista',
        },
      ];
    } else {
      // Dominante
      candidatos = [top];
    }
  }
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
  if (!baseline && candidatos[0]) {
    baseline = {
      version: 1,
      timestamp: new Date().toISOString(),
      arquetipo: candidatos[0].nome,
      confidence: candidatos[0].confidence,
      arquivosRaiz: arquivos.filter((p) => !p.includes('/')).sort(),
    };
    await salvarEstado(baselinePath, baseline);
  }
  // Prioriza baseline apenas se o candidato principal for 'desconhecido' ou confiança baixa
  if (baseline && baseline.arquetipo !== 'desconhecido') {
    const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/'));
    const setBase = new Set(baseline.arquivosRaiz || []);
    const temIntersecao = arquivosRaizAtuais.some((f) => setBase.has(f));
    const candidatoTop = candidatos[0];
    if (temIntersecao && (candidatoTop.nome === 'desconhecido' || candidatoTop.confidence < 50)) {
      const melhorBaseline: ResultadoDeteccaoArquetipo = {
        nome: baseline.arquetipo,
        score: 9999, // força topo da lista
        confidence: baseline.confidence,
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade:
          'Detectado via baseline existente (.oraculo/baseline-estrutura.json).',
        descricao: 'Arquétipo determinado pelo baseline',
      };
      candidatos = [melhorBaseline, ...candidatos.filter((c) => c.nome !== baseline.arquetipo)];
    }
  }
  let drift: ArquetipoDrift | undefined;
  if (baseline && candidatos[0]) {
    const atual = candidatos[0];
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
  // Sugestão de plano para o candidato top
  if (candidatos[0]) {
    try {
      // Usa plano de arquétipos se preset for diferente de 'oraculo' ou em ambiente de teste
      const preset = (contexto as { preset?: string }).preset ?? 'oraculo';
      const emTeste = !!process.env.VITEST;
      const preferEstrategista = preset === 'oraculo' && !emTeste;
      const { plano } = await OperarioEstrutura.planejar(baseDir, contexto.arquivos, {
        preferEstrategista,
        preset,
      });
      if (plano) candidatos[0].planoSugestao = plano;
    } catch {
      // mantém default vazio se falhar
    }
  }
  return { candidatos, baseline, drift };
}
