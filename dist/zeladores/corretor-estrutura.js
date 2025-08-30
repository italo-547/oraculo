// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import { log } from '../nucleo/constelacao/log.js';
import { resolverPluginSeguro } from '../nucleo/constelacao/seguranca.js';
import { importarModuloSeguro } from '../nucleo/util/import-safe.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { reescreverImports } from './util/imports.js';
import { mapaReversao } from './mapa-reversao.js';
export async function corrigirEstrutura(mapa, fileEntries, baseDir = process.cwd()) {
    // Captura dinâmica das configs (evita congelar valores em tempo de import)
    const CONCORRENCIA = Number(config.STRUCTURE_CONCURRENCY ?? 5);
    const AUTO_FIX = Boolean(config.STRUCTURE_AUTO_FIX);
    const PLUGINS = config.STRUCTURE_PLUGINS || [];
    const STRUCTURE_LAYERS = config.STRUCTURE_LAYERS;
    const limit = pLimit(CONCORRENCIA);
    await Promise.all(mapa.map((entry) => limit(async () => {
        const { arquivo, ideal, atual } = entry;
        if (!ideal || ideal === atual)
            return;
        const origem = path.join(baseDir, arquivo);
        // Preserva o nome do arquivo ao mover para a pasta ideal
        const nomeArquivo = path.basename(arquivo);
        const destino = path.join(baseDir, ideal, nomeArquivo);
        if (!AUTO_FIX) {
            log.info(`→ Simular: ${arquivo} → ${path.relative(baseDir, destino)}`);
            return;
        }
        try {
            await fs.mkdir(path.dirname(destino), { recursive: true });
        }
        catch (err) {
            const msg = err && typeof err === 'object' && 'message' in err
                ? String(err.message)
                : String(err);
            log.erro(`❌ Falha ao criar diretório para ${destino}: ${msg}`);
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
            // Reescrever imports relativos (opcional; somente quando AUTO_FIX)
            try {
                if (config.SAFE_MODE && !config.ALLOW_MUTATE_FS) {
                    log.info(`→ SAFE_MODE: simulando escrita/movimento para ${arquivo} → ${path.relative(baseDir, destino)}`);
                }
                else {
                    const conteudo = await fs.readFile(origem, 'utf-8');
                    const { novoConteudo } = reescreverImports(conteudo, path.posix.normalize(arquivo.replace(/\\/g, '/')), path.posix.normalize(path.relative(baseDir, destino).replace(/\\/g, '/')));
                    // Registra o move no mapa de reversão
                    await mapaReversao.registrarMove(arquivo, path.relative(baseDir, destino), entry.motivo || 'Reorganização estrutural', conteudo, novoConteudo, true);
                    await fs.writeFile(destino, novoConteudo, 'utf-8');
                    await fs.unlink(origem);
                }
            }
            catch {
                if (config.SAFE_MODE && !config.ALLOW_MUTATE_FS) {
                    // Já simulamos acima — nada a fazer
                }
                else {
                    // fallback: mover arquivo sem reescrita de imports
                    try {
                        // Registra o move no mapa de reversão sem conteúdo original
                        await mapaReversao.registrarMove(arquivo, path.relative(baseDir, destino), entry.motivo || 'Reorganização estrutural (fallback)', undefined, undefined, true);
                        await fs.rename(origem, destino);
                    }
                    catch (err) {
                        const msg = err && typeof err === 'object' && 'message' in err
                            ? String(err.message)
                            : String(err);
                        log.erro(`❌ Falha ao mover ${arquivo} via rename: ${msg}`);
                        return;
                    }
                }
            }
            log.sucesso(`✅ Movido: ${arquivo} → ${path.relative(baseDir, destino)}`);
        }
        catch (err) {
            const msg = err && typeof err === 'object' && 'message' in err
                ? String(err.message)
                : String(err);
            log.erro(`❌ Falha ao mover ${arquivo}: ${msg}`);
        }
    })));
    for (const pluginRel of PLUGINS) {
        try {
            const resolvido = resolverPluginSeguro(baseDir, String(pluginRel));
            if (resolvido.erro) {
                log.aviso(`⚠️ Plugin ignorado (${pluginRel}): ${resolvido.erro}`);
                continue;
            }
            const caminhoPlugin = resolvido.caminho;
            if (!caminhoPlugin) {
                log.aviso(`⚠️ Caminho de plugin não resolvido: ${String(pluginRel)}`);
                continue;
            }
            const pluginModule = await importarModuloSeguro(baseDir, String(pluginRel));
            let pluginFn;
            if (pluginModule &&
                typeof pluginModule === 'object' &&
                'default' in pluginModule &&
                typeof pluginModule.default === 'function') {
                pluginFn = pluginModule.default;
            }
            else if (typeof pluginModule === 'function') {
                pluginFn = pluginModule;
            }
            if (typeof pluginFn === 'function') {
                await pluginFn({ mapa, baseDir, layers: STRUCTURE_LAYERS, fileEntries });
            }
        }
        catch (err) {
            let msg = 'erro desconhecido';
            if (err &&
                typeof err === 'object' &&
                'message' in err &&
                typeof err.message === 'string') {
                msg = String(err.message);
            }
            else if (typeof err === 'string') {
                msg = err;
            }
            log.aviso(`⚠️ Plugin falhou: ${String(pluginRel)} — ${String(msg)}`);
        }
    }
}
//# sourceMappingURL=corretor-estrutura.js.map