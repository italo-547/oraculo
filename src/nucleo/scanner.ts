import micromatch from 'micromatch';
import { lerEstado } from '../zeladores/util/persistencia.js';
import { promises as fs } from 'node:fs';
import type { Dirent, Stats } from 'node:fs';
import path from 'path';
import { config } from '../nucleo/constelacao/cosmos.js';
import type { FileMap, FileEntry } from '../tipos/tipos.js';

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
        JSON.stringify({
          tipo: 'erro',
          acao: 'acessar',
          caminho: dir,
          mensagem:
            typeof err === 'object' && err && 'message' in err
              ? (err as { message: string }).message
              : String(err),
        }),
      );
      return;
    }

    // Logar apenas diretórios sendo examinados
    onProgress(JSON.stringify({ tipo: 'diretorio', acao: 'examinar', caminho: dir }));

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

          const content = includeContent ? await lerEstado<string>(fullPath) : null;

          if (!stat) throw new Error('Stat indefinido para ' + fullPath);

          const entryObj: FileEntry = {
            fullPath,
            relPath,
            content: content ?? null,
            ultimaModificacao: stat.mtimeMs,
          };

          fileMap[relPath] = entryObj;
          // Logar cada arquivo individualmente para compatibilidade com testes
          onProgress(`✅ Arquivo lido: ${relPath}`);
        } catch (err) {
          onProgress(
            JSON.stringify({
              tipo: 'erro',
              acao: 'ler',
              caminho: relPath,
              mensagem:
                typeof err === 'object' && err && 'message' in err
                  ? (err as { message: string }).message
                  : String(err),
            }),
          );
        }
      }
    }
  }

  await scan(baseDir);
  return fileMap;
}
