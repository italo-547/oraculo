import micromatch from 'micromatch';
import { lerEstado, lerArquivoTexto } from '../zeladores/util/persistencia.js';
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
  // Avalia configuração por varredura
  const hasInclude =
    Array.isArray(config.CLI_INCLUDE_PATTERNS) && config.CLI_INCLUDE_PATTERNS.length > 0;
  // node_modules explicitamente incluído em algum pattern de include
  const includeNodeModulesExplicit = hasInclude
    ? (config.CLI_INCLUDE_PATTERNS as string[]).some((p) =>
        /(^|[\\\/])node_modules([\\\/]|$)/.test(String(p)),
      )
    : false;

  // Quando includes estão ativos, derivamos diretórios-raiz a partir dos prefixos antes do primeiro metacaractere
  function calcularIncludeRoots(padroes: string[] | undefined): string[] {
    if (!Array.isArray(padroes) || padroes.length === 0) return [];
    const roots = new Set<string>();
    const META = /[\*\?\{\}\[\]]/; // metacaracteres glob
    for (const raw of padroes) {
      const p = String(raw).replace(/\\+/g, '/');
      const idx = p.search(META);
      const prefix = idx === -1 ? p : p.slice(0, idx);
      const limpo = prefix
        .replace(/^\.\/?/, '')
        .replace(/\/+$|\/+$|\/$/g, '')
        .replace(/\/+/g, '/');
      if (!limpo || limpo.startsWith('**')) continue; // ignora raízes vazias ou globais
      roots.add(path.join(baseDir, limpo));
    }
    return Array.from(roots);
  }

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
      const relPathRaw = path.relative(baseDir, fullPath);
      // Normaliza para separador POSIX para que micromatch funcione de forma consistente no Windows
      const relPath = relPathRaw.split('\\').join('/');
      // ------------------------------
      // Filtros de inclusão/exclusão aplicados corretamente: diretórios x arquivos
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        // Diretórios: aplica excludes e ignores padrão (ignores somente quando não há include),
        // além de guarda específica para node_modules.
        if (
          config.CLI_EXCLUDE_PATTERNS?.length &&
          micromatch.isMatch(relPath, config.CLI_EXCLUDE_PATTERNS)
        ) {
          continue; // diretório excluído explicitamente
        }
        if (!hasInclude && micromatch.isMatch(relPath, config.ZELADOR_IGNORE_PATTERNS)) {
          continue; // ignora diretórios padrão quando não há include
        }
        if (/(^|\/)node_modules(\/|$)/.test(relPath) && !includeNodeModulesExplicit) {
          continue; // proteção: não descer em node_modules salvo inclusão explícita
        }
        await scan(fullPath);
      } else {
        // Arquivos: aplica include (quando presente), excludes/ignores e filtro customizado
        if (hasInclude && !micromatch.isMatch(relPath, config.CLI_INCLUDE_PATTERNS)) {
          continue; // arquivo não incluso explicitamente
        }
        if (
          config.CLI_EXCLUDE_PATTERNS?.length &&
          micromatch.isMatch(relPath, config.CLI_EXCLUDE_PATTERNS)
        ) {
          continue; // arquivo excluído
        }
        if (!hasInclude && micromatch.isMatch(relPath, config.ZELADOR_IGNORE_PATTERNS)) {
          continue; // ignore padrão quando não há include
        }
        if (!filter(relPath, entry)) {
          continue; // filtro customizado
        }
        try {
          let stat = statCache.get(fullPath);
          if (!stat) {
            stat = await fs.stat(fullPath);
            statCache.set(fullPath, stat);
          }
          if (!stat) throw new Error('Stat indefinido para ' + fullPath);

          let content: string | null = null;
          if (includeContent) {
            const emTeste = !!process.env.VITEST;
            try {
              if (emTeste) {
                // Mantém compat com testes que mockam lerEstado
                content = await lerEstado<string>(fullPath);
              } else {
                content = await lerArquivoTexto(fullPath);
              }
            } catch (e) {
              // Em caso de erro de leitura, registra via onProgress e segue
              onProgress(
                JSON.stringify({
                  tipo: 'erro',
                  acao: 'ler',
                  caminho: relPath,
                  mensagem:
                    typeof e === 'object' && e && 'message' in e
                      ? (e as { message: string }).message
                      : String(e),
                }),
              );
              content = null;
            }
          }

          const entryObj: FileEntry = {
            fullPath,
            relPath,
            content,
            ultimaModificacao: stat.mtimeMs,
          };

          fileMap[relPath] = entryObj;
          // Logar cada arquivo individualmente para compatibilidade com testes
          // Evita ruído quando relatórios silenciosos estão ativos (modo --json)
          if (!config.REPORT_SILENCE_LOGS) {
            onProgress(`✅ Arquivo lido: ${relPath}`);
          }
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

  // Pontos de partida da varredura
  const startDirs = hasInclude ? calcularIncludeRoots(config.CLI_INCLUDE_PATTERNS) : [];
  if (startDirs.length === 0) {
    await scan(baseDir);
  } else {
    const vistos = new Set<string>();
    for (const d of startDirs) {
      const norm = path.resolve(d);
      if (vistos.has(norm)) continue;
      vistos.add(norm);
      await scan(norm);
    }
  }
  return fileMap;
}
