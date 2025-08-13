import { promises as fs } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import { resolverPluginSeguro } from '../nucleo/constelacao/seguranca.js';
import type { FileEntryWithAst } from '../tipos/tipos.js';

const {
  STRUCTURE_PLUGINS: PLUGINS = [],
  STRUCTURE_AUTO_FIX: AUTO_FIX = false,
  STRUCTURE_CONCURRENCY: CONCORRENCIA = 5,
  STRUCTURE_LAYERS,
} = config;

interface ResultadoEstrutural {
  arquivo: string;
  ideal: string | null;
  atual: string;
}

export async function corrigirEstrutura(
  mapa: ResultadoEstrutural[],
  fileEntries: FileEntryWithAst[],
  baseDir: string = process.cwd(),
): Promise<void> {
  const limit = pLimit(CONCORRENCIA);

  await Promise.all(
    mapa.map((entry) =>
      limit(async () => {
        const { arquivo, ideal, atual } = entry;
        if (!ideal || ideal === atual) return;

        const origem = path.join(baseDir, arquivo);
        const destinoRelativo = path.relative(atual || '', arquivo);
        const destino = path.join(baseDir, ideal, destinoRelativo);

        if (!AUTO_FIX) {
          log.info(`→ Simular: ${arquivo} → ${path.relative(baseDir, destino)}`);
          return;
        }

        try {
          await fs.mkdir(path.dirname(destino), { recursive: true });
        } catch (err) {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
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

          await fs.rename(origem, destino);
          log.sucesso(`✅ Movido: ${arquivo} → ${path.relative(baseDir, destino)}`);
        } catch (err) {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : String(err);
          log.erro(`❌ Falha ao mover ${arquivo}: ${msg}`);
        }
      }),
    ),
  );

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
      const pluginModule: unknown = await import(caminhoPlugin);
      let pluginFn:
        | ((args: {
          mapa: ResultadoEstrutural[];
          baseDir: string;
          layers: typeof STRUCTURE_LAYERS;
          fileEntries: FileEntryWithAst[];
        }) => Promise<void> | void)
        | undefined;
      if (
        pluginModule &&
        typeof pluginModule === 'object' &&
        'default' in pluginModule &&
        typeof (pluginModule as Record<string, unknown>).default === 'function'
      ) {
        pluginFn = (pluginModule as { default: typeof pluginFn }).default;
      } else if (typeof pluginModule === 'function') {
        pluginFn = pluginModule as typeof pluginFn;
      }
      if (typeof pluginFn === 'function') {
        await pluginFn({ mapa, baseDir, layers: STRUCTURE_LAYERS, fileEntries });
      }
    } catch (err) {
      let msg = 'erro desconhecido';
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
      ) {
        msg = String((err as { message: string }).message);
      } else if (typeof err === 'string') {
        msg = err;
      }
      log.aviso(`⚠️ Plugin falhou: ${String(pluginRel)} — ${String(msg)}`);
    }
  }
}
