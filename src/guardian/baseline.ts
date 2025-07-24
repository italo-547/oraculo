import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BASELINE_PATH } from './constantes';
/**
 * Lê o baseline atual do sistema de integridade.
 * Retorna null se o arquivo não existir ou estiver malformado.
 */
export async function carregarBaseline() {
    try {
        const txt = await fs.readFile(BASELINE_PATH, 'utf-8');
        return JSON.parse(txt);
    }
    catch {
        return null;
    }
}
/**
 * Salva um novo baseline de integridade em disco, sobrescrevendo qualquer estado anterior.
 *
 * @param snapshot Mapa de arquivos com seus hashes e algoritmos
 */
export async function salvarBaseline(snapshot) {
    await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
    await fs.writeFile(BASELINE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
}
