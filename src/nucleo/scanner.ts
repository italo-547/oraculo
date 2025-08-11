import micromatch from 'micromatch';
import { promises as fs } from 'node:fs';
import type { Dirent, Stats } from 'node:fs';
import path from 'path';
import { config } from '../nucleo/constelacao/cosmos.js';
import type { FileMap, FileEntry } from '../tipos/tipos.js';

const UTF8 = 'utf-8';

interface ScanOptions {
  includeContent?: boolean;
  filter?: (relPath: string, entry: Dirent) => boolean;
  onProgress?: (msg: string) => void;
}

export async function scanRepository(baseDir: string, options: ScanOptions = {}): Promise<FileMap> {
  const {
    includeContent = true,
    filter = () => true,
    onProgress = () => {
      return undefined;
    },
  } = options;

  const fileMap: FileMap = {};
  const statCache = new Map<string, Stats>();

  async function scan(dir: string): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      onProgress(
        `⚠️ Falha ao acessar ${dir}: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`,
      );
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath);

      if (micromatch.isMatch(relPath, config.ZELADOR_IGNORE_PATTERNS)) continue;
      if (!filter(relPath, entry)) continue;

      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        await scan(fullPath);
      } else {
        try {
          let stat = statCache.get(fullPath);
          if (!stat) {
            stat = await fs.stat(fullPath);
            statCache.set(fullPath, stat);
          }

          const content = includeContent ? await fs.readFile(fullPath, UTF8) : null;

          const entryObj: FileEntry = {
            fullPath,
            relPath,
            content: content ?? null,
            ultimaModificacao: stat.mtimeMs,
          };

          fileMap[relPath] = entryObj;
          onProgress(`✅ Arquivo lido: ${relPath}`);
        } catch (err) {
          onProgress(
            `⚠️ Erro ao ler ${relPath}: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`,
          );
        }
      }
    }
  }

  await scan(baseDir);
  return fileMap;
}
