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
  ArquetipoPersonalizado,
} from '../tipos/tipos.js';
import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';
import { OperarioEstrutura } from '../zeladores/operario-estrutura.js';
import path from 'node:path';
import {
  carregarArquetipoPersonalizado,
  obterArquetipoOficial,
  integrarArquetipos,
} from './arquetipos-personalizados.js';

const PENALIDADE_MISSING_REQUIRED = 20;
const PESO_OPTIONAL = 5;
const PESO_REQUIRED = 10;
const PESO_DEPENDENCIA = 10;
const PESO_PATTERN = 5;
const PENALIDADE_FORBIDDEN = 20;

// Constantes adaptativas baseadas no tamanho do projeto
function calcularConstantesAdaptativas(totalArquivos: number, totalDirs: number) {
  // Fator de escala baseado no tamanho do projeto
  const tamanhoProjeto = Math.min(totalArquivos / 100, 5); // máximo 5x
  const complexidade = Math.min(totalDirs / 20, 3); // máximo 3x

  return {
    // Penalidades mais brandas para projetos grandes
    PENALIDADE_MISSING_REQUIRED_ADAPTADO: Math.max(
      PENALIDADE_MISSING_REQUIRED * (1 - tamanhoProjeto * 0.1),
      5,
    ),
    // Pesos maiores para projetos complexos
    PESO_OPTIONAL_ADAPTADO: PESO_OPTIONAL * (1 + complexidade * 0.2),
    PESO_DEPENDENCIA_ADAPTADO: PESO_DEPENDENCIA * (1 + complexidade * 0.15),
    // Penalização por arquivos proibidos mais contextual
    PENALIDADE_FORBIDDEN_ADAPTADO: PENALIDADE_FORBIDDEN * (1 + tamanhoProjeto * 0.05),
    // Bônus por completude mais significativo em projetos grandes
    BONUS_COMPLETUDE: 50 + tamanhoProjeto * 20,
  };
}

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

  // Calcular constantes adaptativas baseadas no projeto
  const totalArquivos = arquivos.length;
  const totalDirs = new Set(arquivos.map((f) => f.split('/')[0])).size;
  const constantes = calcularConstantesAdaptativas(totalArquivos, totalDirs);

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
    bonusEspecificidade =
      pesoBase > 1 ? constantes.BONUS_COMPLETUDE : constantes.BONUS_COMPLETUDE * 0.6;
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
  score -= missingRequired.length * constantes.PENALIDADE_MISSING_REQUIRED_ADAPTADO;
  score += matchedOptional.length * constantes.PESO_OPTIONAL_ADAPTADO;
  score += dependencyMatches.length * constantes.PESO_DEPENDENCIA_ADAPTADO;
  score += filePatternMatches.length * PESO_PATTERN;
  score -= forbiddenPresent.length * constantes.PENALIDADE_FORBIDDEN_ADAPTADO;
  score += bonusEspecificidade;
  score -= penalidadeGenérico;

  // Enriquecimento heurístico: ajusta score conforme sinais avançados do projeto
  let explicacaoSinais = '';
  if (sinaisAvancados) {
    // Sistema de pontuação adaptativo baseado na maturidade do projeto
    const maturidadeProjeto = Math.min(
      (sinaisAvancados.funcoes + sinaisAvancados.classes + sinaisAvancados.tipos.length) / 50,
      3,
    );

    // 1. Funções - mais peso para projetos maduros
    if (sinaisAvancados.funcoes > 10) {
      const bonusFuncoes = Math.min(15, sinaisAvancados.funcoes * 0.1) * maturidadeProjeto;
      score += bonusFuncoes;
      explicacaoSinais += `Detectado ${sinaisAvancados.funcoes} funções declaradas (+${bonusFuncoes.toFixed(1)}).\n`;
    }

    // 2. Imports - contexto importa mais que quantidade
    if (sinaisAvancados.imports.length > 0) {
      const bonusImports = Math.min(12, sinaisAvancados.imports.length * 0.8);
      score += bonusImports;
      explicacaoSinais += `Imports detectados: ${sinaisAvancados.imports.slice(0, 3).join(', ')}${sinaisAvancados.imports.length > 3 ? '...' : ''} (+${bonusImports.toFixed(1)}).\n`;
    }

    // 3. Variáveis - menos peso, mas ainda relevante
    if (sinaisAvancados.variaveis > 10) {
      const bonusVars = Math.min(8, sinaisAvancados.variaveis * 0.05);
      score += bonusVars;
      explicacaoSinais += `Detectado ${sinaisAvancados.variaveis} variáveis (+${bonusVars.toFixed(1)}).\n`;
    }

    // 4. Tipos - forte indicador de maturidade TypeScript
    if (sinaisAvancados.tipos.length > 0) {
      const bonusTipos = Math.min(15, sinaisAvancados.tipos.length * 0.6) * maturidadeProjeto;
      score += bonusTipos;
      explicacaoSinais += `Tipos/Interfaces detectados: ${sinaisAvancados.tipos.slice(0, 2).join(', ')}${sinaisAvancados.tipos.length > 2 ? '...' : ''} (+${bonusTipos.toFixed(1)}).\n`;
    }

    // 5. Classes - indica arquitetura orientada a objetos
    if (sinaisAvancados.classes > 0) {
      const bonusClasses = Math.min(12, sinaisAvancados.classes * 2) * maturidadeProjeto;
      score += bonusClasses;
      explicacaoSinais += `Detectado ${sinaisAvancados.classes} classes (+${bonusClasses.toFixed(1)}).\n`;
    }

    // 6. Frameworks detectados - alto peso pois indica stack específica
    if (sinaisAvancados.frameworksDetectados.length > 0) {
      const bonusFrameworks = sinaisAvancados.frameworksDetectados.length * 8;
      score += bonusFrameworks;
      explicacaoSinais += `Frameworks detectados: ${sinaisAvancados.frameworksDetectados.join(', ')} (+${bonusFrameworks.toFixed(1)}).\n`;
    }

    // 7. Dependências - indica ecossistema
    if (sinaisAvancados.dependencias.length > 0) {
      const bonusDeps = Math.min(10, sinaisAvancados.dependencias.length * 0.3);
      score += bonusDeps;
      explicacaoSinais += `Dependências detectadas: ${sinaisAvancados.dependencias.length} (+${bonusDeps.toFixed(1)}).\n`;
    }

    // Scripts npm - indica automação
    if (sinaisAvancados.scripts.length > 0) {
      const bonusScripts = Math.min(6, sinaisAvancados.scripts.length * 0.4);
      score += bonusScripts;
      explicacaoSinais += `Scripts detectados: ${sinaisAvancados.scripts.length} (+${bonusScripts.toFixed(1)}).\n`;
    }

    // Pastas padrão - indica estrutura organizada
    if (sinaisAvancados.pastasPadrao.length > 0) {
      const bonusPastas = Math.min(8, sinaisAvancados.pastasPadrao.length * 0.5);
      score += bonusPastas;
      explicacaoSinais += `Pastas padrão detectadas: ${sinaisAvancados.pastasPadrao.length} (+${bonusPastas.toFixed(1)}).\n`;
    }

    // Arquivos padrão - indica pontos de entrada
    if (sinaisAvancados.arquivosPadrao.length > 0) {
      const bonusArquivos = Math.min(6, sinaisAvancados.arquivosPadrao.length * 0.8);
      score += bonusArquivos;
      explicacaoSinais += `Arquivos padrão detectados: ${sinaisAvancados.arquivosPadrao.length} (+${bonusArquivos.toFixed(1)}).\n`;
    }

    // Arquivos de configuração - indica setup profissional
    if (sinaisAvancados.arquivosConfig.length > 0) {
      const bonusConfig = Math.min(5, sinaisAvancados.arquivosConfig.length * 0.6);
      score += bonusConfig;
      explicacaoSinais += `Arquivos de configuração detectados: ${sinaisAvancados.arquivosConfig.length} (+${bonusConfig.toFixed(1)}).\n`;
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
    (def.optionalDirs?.length || 0) * constantes.PESO_OPTIONAL_ADAPTADO +
    (def.dependencyHints?.length || 0) * constantes.PESO_DEPENDENCIA_ADAPTADO +
    (def.filePresencePatterns?.length || 0) * PESO_PATTERN +
    constantes.BONUS_COMPLETUDE;

  // Sistema de confiança mais inteligente
  let confidence = maxPossible > 0 ? Math.min(100, Math.round((score / maxPossible) * 100)) : 0;

  // Ajustes contextuais para confiança
  if (sinaisAvancados) {
    // Projetos com frameworks têm confiança maior
    if (sinaisAvancados.frameworksDetectados.length > 0) {
      confidence = Math.min(100, confidence + 5);
    }

    // Projetos com tipos TypeScript têm confiança maior
    if (sinaisAvancados.tipos.length > 10) {
      confidence = Math.min(100, confidence + 3);
    }

    // Projetos com estrutura de pastas organizada têm confiança maior
    if (sinaisAvancados.pastasPadrao.length > 3) {
      confidence = Math.min(100, confidence + 4);
    }

    // Penalizar confiança se há muitos arquivos proibidos
    if (forbiddenPresent.length > 2) {
      confidence = Math.max(0, confidence - 10);
    }

    // Penalizar confiança se muitos requisitos obrigatórios estão faltando
    if (missingRequired.length > required.length * 0.5) {
      confidence = Math.max(0, confidence - 15);
    }
  }

  // Normalização final baseada no tamanho do projeto
  if (totalArquivos > 500) {
    // Projetos muito grandes: reduzir confiança se não há estrutura clara
    if (confidence < 60) {
      confidence = Math.max(0, confidence - 5);
    }
  } else if (totalArquivos < 20) {
    // Projetos muito pequenos: aumentar confiança se há estrutura mínima
    if (matchedRequired.length > 0) {
      confidence = Math.min(100, confidence + 10);
    }
  }

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
  arquetipoPersonalizado?: ArquetipoPersonalizado | null; // Para compatibilidade futura
}> {
  const arquivos = contexto.arquivos.map((f) => f.relPath);

  // Carregar arquétipo personalizado se existir
  const arquetipoPersonalizado = await carregarArquetipoPersonalizado(baseDir);
  let arquetiposParaAvaliar = ARQUETIPOS;

  // Se há arquétipo personalizado, integrá-lo com o oficial
  if (arquetipoPersonalizado) {
    const arquetipoOficial = obterArquetipoOficial(arquetipoPersonalizado);
    if (arquetipoOficial) {
      const arquetipoIntegrado = integrarArquetipos(arquetipoPersonalizado, arquetipoOficial);
      // Substituir o oficial pelo personalizado na lista de avaliação
      arquetiposParaAvaliar = ARQUETIPOS.map((arq) =>
        arq.nome === arquetipoPersonalizado.arquetipoOficial ? arquetipoIntegrado : arq,
      );
    }
  }

  // Extrai sinais avançados do projeto
  const sinaisAvancados = extrairSinaisAvancados(
    contexto.arquivos,
    await lerEstado(path.join(baseDir, 'package.json')),
    undefined,
    baseDir,
    arquivos,
  );

  // Pontua todos os arquétipos disponíveis usando sinais avançados
  let candidatos = arquetiposParaAvaliar.map((def) =>
    scoreArquetipo(def, arquivos, sinaisAvancados),
  );
  // Ordena por confiança/score decrescente
  candidatos.sort((a, b) => b.confidence - a.confidence || b.score - a.score);

  // Decisão final: dominante, misto ou desconhecido
  // Agora considera fatores contextuais e thresholds adaptativos
  const scoresValidos = candidatos.filter((c) => c.confidence >= 30);

  if (!scoresValidos.length) {
    // Nenhum padrão relevante - verificar se é um projeto muito pequeno ou não estruturado
    const temAlgumaEstrutura = arquivos.some(
      (f) =>
        f.includes('src/') || f.includes('lib/') || f.includes('app/') || f.includes('packages/'),
    );

    candidatos = [
      {
        nome: 'desconhecido',
        score: 0,
        confidence: temAlgumaEstrutura ? 10 : 0, // pequena confiança se há alguma estrutura
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: temAlgumaEstrutura
          ? 'Projeto tem alguma estrutura, mas não corresponde a arquétipos conhecidos. Considere organizar em src/, lib/ ou app/.'
          : 'Projeto sem estrutura clara detectada. Considere criar uma organização básica.',
        explicacaoSimilaridade: temAlgumaEstrutura
          ? 'Estrutura parcial detectada, mas não suficiente para classificação.'
          : 'Nenhum arquétipo identificado.',
        descricao: 'Nenhum arquétipo identificado.',
      },
    ];
  } else {
    // Análise mais sofisticada para decidir entre dominante e misto
    const top = scoresValidos[0];
    const proximos = scoresValidos.filter(
      (c) => c !== top && Math.abs(c.confidence - top.confidence) <= 15, // threshold aumentado
    );

    // Verificar se é realmente um caso híbrido ou apenas competição próxima
    const ehHibridoReal = proximos.some(
      (c) =>
        // Verificar se há sobreposição significativa de características
        c.matchedRequired.some((req) => top.matchedRequired.includes(req)) ||
        c.dependencyMatches.some((dep) => top.dependencyMatches.includes(dep)),
    );

    if (proximos.length > 0 && ehHibridoReal) {
      // Sistema de pontuação para casos híbridos
      const scoreHibrido =
        top.score * 0.7 + proximos.reduce((acc, c) => acc + (c.score * 0.3) / proximos.length, 0);
      const confidenceHibrido = Math.max(top.confidence - 10, 40); // reduzir confiança mas manter mínimo

      candidatos = [
        {
          nome: 'misto',
          score: Math.round(scoreHibrido),
          confidence: confidenceHibrido,
          matchedRequired: [],
          missingRequired: [],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: [],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: `Estrutura híbrida detectada: combina elementos de ${[top.nome, ...proximos.map((p) => p.nome)].join(', ')}. Recomenda-se avaliar se a separação em projetos distintos seria benéfica.`,
          descricao: 'Estrutura híbrida',
        },
      ];
    } else {
      // Dominante claro
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
        score: 999, // força topo da lista
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
  return {
    candidatos,
    baseline,
    drift,
    arquetipoPersonalizado,
  };
}
