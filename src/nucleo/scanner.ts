// src/nucleo/scanner.ts
import micromatch from 'micromatch';
import { promises as fs } from 'fs'; // fs.promises
import config from '../nucleo/constelacao/cosmos';
import path from 'path';
const UTF8 = 'utf-8';
export async function scanRepository(baseDir, options = {}) {
    const { includeContent = true, filter = () => true, onProgress = () => { } } = options;
    const fileMap = {};
    const statCache = new Map();
    async function scan(dir) {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
            entries.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (err) {
            onProgress(`⚠️ Falha ao acessar ${dir}: ${err.message}`);
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(baseDir, fullPath);
            if (micromatch.isMatch(relPath, config.ZELADOR_IGNORE_PATTERNS))
                continue;
            if (!filter(relPath, entry))
                continue;
            if (entry.isDirectory() && !entry.isSymbolicLink()) {
                await scan(fullPath);
            }
            else {
                try {
                    let stat = statCache.get(fullPath);
                    if (!stat) {
                        stat = await fs.stat(fullPath);
                        statCache.set(fullPath, stat);
                    }
                    const content = includeContent
                        ? await fs.readFile(fullPath, UTF8)
                        : null;
                    fileMap[relPath] = {
                        fullPath,
                        relPath,
                        content,
                        ultimaModificacao: stat.mtimeMs
                    };
                    onProgress(`✅ Arquivo lido: ${relPath}`);
                }
                catch (err) {
                    onProgress(`⚠️ Erro ao ler ${relPath}: ${err.message}`);
                }
            }
        }
    }
    await scan(baseDir);
    return fileMap;
}
