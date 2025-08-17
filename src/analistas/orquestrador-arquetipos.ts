import type { ResultadoDeteccaoArquetipo } from '@tipos/tipos.js';
import { detectarArquetipoNode } from './detectores/detector-node.js';
import { detectarArquetipoJava } from './detectores/detector-java.js';
import { detectarArquetipoKotlin } from './detectores/detector-kotlin.js';
import { detectarArquetipoXML } from './detectores/detector-xml.js';

/**
 * Orquestrador central de detecção de arquétipos
 * Agrega votos dos detectores especializados e decide o arquétipo final
 */
export function detectarArquetipo(arquivos: string[]): ResultadoDeteccaoArquetipo {
  // Chama todos detectores
  const resultados: ResultadoDeteccaoArquetipo[] = [
    ...detectarArquetipoNode(arquivos),
    ...detectarArquetipoJava(arquivos),
    ...detectarArquetipoKotlin(arquivos),
    ...detectarArquetipoXML(arquivos),
  ];
  // Seleciona o melhor candidato (maior score, desempate por confiança)
  if (resultados.length === 0) {
    return {
      nome: 'desconhecido',
      descricao: 'Nenhum arquétipo identificado',
      score: 0,
      confidence: 0,
      matchedRequired: [],
      missingRequired: [],
      matchedOptional: [],
      dependencyMatches: [],
      filePatternMatches: [],
      forbiddenPresent: [],
      anomalias: [],
    };
  }
  return resultados.reduce((a, b) => (a.score > b.score ? a : b));
}
