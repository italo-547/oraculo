// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import { resolverPluginSeguro } from '../nucleo/constelacao/seguranca.js';
import { reescreverImports } from './util/imports.js';
import type { FileEntryWithAst } from '../tipos/tipos.js';

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
  // Captura dinâmica das configs (evita congelar valores em tempo de import)
  const CONCORRENCIA = Number(config.STRUCTURE_CONCURRENCY ?? 5);
  const AUTO_FIX = Boolean(config.STRUCTURE_AUTO_FIX);
  const PLUGINS = (config.STRUCTURE_PLUGINS as unknown[]) || [];
  const STRUCTURE_LAYERS = config.STRUCTURE_LAYERS;

  const limit = pLimit(CONCORRENCIA);

  await Promise.all(
    mapa.map((entry) =>
      limit(async () => {
        const { arquivo, ideal, atual } = entry;
        if (!ideal || ideal === atual) return;

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

          // Reescrever imports relativos (opcional; somente quando AUTO_FIX)
          try {
            const conteudo = await fs.readFile(origem, 'utf-8');
            const { novoConteudo } = reescreverImports(
              conteudo,
              path.posix.normalize(arquivo.replace(/\\/g, '/')),
              path.posix.normalize(path.relative(baseDir, destino).replace(/\\/g, '/')),
            );
            await fs.writeFile(destino, novoConteudo, 'utf-8');
            await fs.unlink(origem);
          } catch (_e) {
            // AVISO: Ignoramos intencionalmente a exceção aqui.
            // Motivo: se a reescrita de imports falhar (ex.: arquivo não textual,
            // parsers/heurísticas não suportam o conteúdo, ou falhas transitórias de IO),
            // fazemos fallback para um move simples via fs.rename sem tocar no conteúdo.
            // Isso mantém a rotina resiliente em execuções automáticas (AUTO_FIX) sem abortar
            // toda a correção por um caso isolado. Em ocorrências frequentes, promover para
            // log de aviso e/ou instrumentar métrica pontual pode ser considerado.
            // A variável _e é preservada para depuração eventual.
            // fallback: mover arquivo sem reescrita se algo falhar na leitura/escrita
            try {
              await fs.rename(origem, destino);
            } catch (err) {
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : String(err);
              log.erro(`❌ Falha ao mover ${arquivo} via rename: ${msg}`);
              return;
            }
          }
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
