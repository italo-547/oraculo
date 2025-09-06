// SPDX-License-Identifier: MIT
import { analistaFuncoesLongas } from './analista-funcoes-longas.js';
import { analistaPadroesUso } from './analista-padroes-uso.js';
import * as detectorDependenciasMod from './detector-dependencias.js';
import * as detectorEstruturaMod from './detector-estrutura.js';
import { ritualComando } from './ritual-comando.js';
import { analistaTodoComments } from './analista-todo-comments.js';
// Registro central de analistas. Futuro: lazy loading, filtros por categoria.
const detectorDependencias = detectorDependenciasMod.detectorDependencias ??
    detectorDependenciasMod.default ??
    detectorDependenciasMod;
const detectorEstrutura = detectorEstruturaMod.detectorEstrutura ??
    detectorEstruturaMod.default ??
    detectorEstruturaMod;
export const registroAnalistas = [
    detectorDependencias,
    detectorEstrutura,
    analistaFuncoesLongas,
    analistaPadroesUso,
    ritualComando,
    analistaTodoComments,
];
export function listarAnalistas() {
    return registroAnalistas.map((a) => ({
        nome: a.nome || 'desconhecido',
        categoria: a.categoria || 'n/d',
        descricao: a.descricao || '',
    }));
}
//# sourceMappingURL=registry.js.map