import { analistaFuncoesLongas } from './analista-funcoes-longas.js';
import { analistaPadroesUso } from './analista-padroes-uso.js';
import { detectorDependencias } from './detector-dependencias.js';
import { detectorEstrutura } from './detector-estrutura.js';
import { ritualComando } from './ritual-comando.js';
import type { Analista, Tecnica } from '../tipos/tipos.js';

// Registro central de analistas. Futuro: lazy loading, filtros por categoria.
export const registroAnalistas: (Analista | Tecnica)[] = [
  detectorDependencias as unknown as Tecnica,
  detectorEstrutura as unknown as Tecnica,
  analistaFuncoesLongas,
  analistaPadroesUso as unknown as Tecnica,
  ritualComando as unknown as Tecnica,
];

export function listarAnalistas() {
  return registroAnalistas.map((a) => ({
    nome: (a as Analista).nome || 'desconhecido',
    categoria: (a as Analista).categoria || 'n/d',
    descricao: (a as Analista).descricao || '',
  }));
}
