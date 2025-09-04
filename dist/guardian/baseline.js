// SPDX-License-Identifier: MIT
import { salvarEstado, lerEstado } from '@zeladores/util/persistencia.js';
import path from 'node:path';
import { BASELINE_PATH } from './constantes.js';
/**
 * Lê o baseline atual do sistema de integridade.
 * Retorna null se o arquivo não existir ou estiver malformado.
 */
export async function carregarBaseline() {
    try {
        const json = await lerEstado(BASELINE_PATH);
        if (json && typeof json === 'object' && !Array.isArray(json)) {
            const entries = Object.entries(json).filter(([k, v]) => typeof k === 'string' && typeof v === 'string');
            return Object.fromEntries(entries);
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Salva um novo baseline de integridade em disco, sobrescrevendo qualquer estado anterior.
 */
export async function salvarBaseline(snapshot) {
    await import('node:fs').then((fs) => fs.promises.mkdir(path.dirname(BASELINE_PATH), { recursive: true }));
    await salvarEstado(BASELINE_PATH, snapshot);
}
//# sourceMappingURL=baseline.js.map