import config from '../nucleo/constelacao/cosmos.js';
/**
 * Compara dois snapshots de integridade e retorna as diferenças encontradas.
 * - Arquivos removidos
 * - Arquivos adicionados
 * - Arquivos alterados (mesmo nome, conteúdo diferente)
 */
export function diffSnapshots(before, after) {
    const removidos = Object.keys(before).filter(key => !(key in after));
    const adicionados = Object.keys(after).filter(key => !(key in before));
    const alterados = Object.keys(before).filter(key => key in after && before[key].hash !== after[key].hash);
    return { removidos, adicionados, alterados };
}
/**
 * Gera mensagens de erro de integridade com base nas permissões configuradas.
 */
export function verificarErros(diffs) {
    const erros = [];
    if (diffs.removidos.length > 0 && !config.GUARDIAN_ALLOW_DELS) {
        erros.push(`🗑️ Arquivos removidos: ${diffs.removidos.join(', ')}`);
    }
    if (diffs.adicionados.length > 0 && !config.GUARDIAN_ALLOW_ADDS) {
        erros.push(`📁 Arquivos adicionados: ${diffs.adicionados.join(', ')}`);
    }
    if (diffs.alterados.length > 0 && !config.GUARDIAN_ALLOW_CHG) {
        erros.push(`✏️ Arquivos alterados: ${diffs.alterados.join(', ')}`);
    }
    return erros;
}
