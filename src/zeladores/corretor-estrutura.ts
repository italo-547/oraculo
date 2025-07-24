import { promises as fs } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import config from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
const { STRUCTURE_PLUGINS: PLUGINS = [], STRUCTURE_AUTO_FIX: AUTO_FIX = false, STRUCTURE_CONCURRENCY: CONCORRENCIA = 5, STRUCTURE_LAYERS } = config;
export async function corrigirEstrutura(mapa, fileEntries, baseDir = process.cwd()) {
    const limit = pLimit(CONCORRENCIA);
    await Promise.all(mapa.map(entry => limit(async () => {
        const { arquivo, ideal, atual } = entry;
        if (!ideal || ideal === atual)
            return;
        const origem = path.join(baseDir, arquivo);
        const destinoRelativo = path.relative(atual || '', arquivo);
        const destino = path.join(baseDir, ideal, destinoRelativo);
        if (!AUTO_FIX) {
            log.info(`→ Simular: ${arquivo} → ${path.relative(baseDir, destino)}`);
            return;
        }
        try {
            await fs.mkdir(path.dirname(destino), { recursive: true });
        }
        catch (err) {
            log.erro(`❌ Falha ao criar diretório para ${destino}: ${err.message}`);
            return;
        }
        try {
            const destinoExiste = await fs
                .stat(destino)
                .then(() => true)
                .catch(() => false);
            if (destinoExiste) {
                log.erro(`⚠️ Destino já existe: ${arquivo} → ${path.relative(baseDir, destino)}`);
                return;
            }
            await fs.rename(origem, destino);
            log.sucesso(`✅ Movido: ${arquivo} → ${path.relative(baseDir, destino)}`);
        }
        catch (err) {
            log.erro(`❌ Falha ao mover ${arquivo}: ${err.message}`);
        }
    })));
    for (const pluginRel of PLUGINS) {
        try {
            const pluginModule = await import(path.resolve(baseDir, pluginRel));
            const plugin = pluginModule.default ?? pluginModule;
            if (typeof plugin === 'function') {
                await plugin({ mapa, baseDir, layers: STRUCTURE_LAYERS, fileEntries });
            }
        }
        catch (err) {
            log.aviso(`⚠️ Plugin falhou: ${pluginRel} — ${err.message}`);
        }
    }
}
