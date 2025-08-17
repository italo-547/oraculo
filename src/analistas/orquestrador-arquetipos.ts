import type { ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';
import { detectarArquetipoNode } from './detectores/detector-node.js';
import { detectarArquetipoJava } from './detectores/detector-java.js';
import { detectarArquetipoKotlin } from './detectores/detector-kotlin.js';
import { detectarArquetipoXML } from './detectores/detector-xml.js';
import { pontuarTodos } from './deteccao/pontuador.js';

/**
 * Orquestrador central de detecção de arquétipos
 * Agrega votos dos detectores especializados e decide o arquétipo final
 */
export function detectarArquetipo(arquivos: string[]): ResultadoDeteccaoArquetipo {
  // Agregação dos detectores por stack
  const candidatos: ResultadoDeteccaoArquetipo[] = [
    ...detectarArquetipoNode(arquivos),
    ...detectarArquetipoJava(arquivos),
    ...detectarArquetipoKotlin(arquivos),
    ...detectarArquetipoXML(arquivos),
  ];

  let lista = candidatos;
  if (!lista.length) {
    // Fallback de compatibilidade: usar o pontuador completo para preservar comportamento legado
    lista = pontuarTodos(arquivos);
  }

  // Se ainda vazio, é desconhecido
  if (!lista.length) {
    return {
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
      explicacaoSimilaridade: '',
      descricao: 'Arquétipo não identificado',
    };
  }

  // Ordenação próxima do legado: menor missingRequired, maior score, maior matchedRequired, maior confidence, nome asc
  lista.sort((a, b) => {
    const mm = (a.missingRequired?.length || 0) - (b.missingRequired?.length || 0);
    if (mm !== 0) return mm;
    if (b.score !== a.score) return b.score - a.score;
    const mr = (b.matchedRequired?.length || 0) - (a.matchedRequired?.length || 0);
    if (mr !== 0) return mr;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.nome.localeCompare(b.nome);
  });

  const best = lista[0];
  const hasSignals =
    (best.matchedRequired?.length || 0) > 0 ||
    (best.matchedOptional?.length || 0) > 0 ||
    (best.dependencyMatches?.length || 0) > 0 ||
    (best.filePatternMatches?.length || 0) > 0 ||
    (best.forbiddenPresent?.length || 0) > 0;
  if (!hasSignals || best.score <= 0) {
    return {
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
      explicacaoSimilaridade: '',
      descricao: 'Arquétipo não identificado',
    };
  }
  return best;
}
