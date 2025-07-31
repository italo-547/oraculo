import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BASELINE_PATH } from './constantes.js';
/**
 * Lê o baseline atual do sistema de integridade.
 * Retorna null se o arquivo não existir ou estiver malformado.
 */
export async function carregarBaseline() {
    try {
        const txt = await fs.readFile(BASELINE_PATH, 'utf-8');
        const json = JSON.parse(txt);
        if (json && typeof json === 'object') {
            return json;
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
    await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
    await fs.writeFile(BASELINE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
}
