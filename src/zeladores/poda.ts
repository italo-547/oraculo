// SPDX-License-Identifier: MIT
import { lerEstado, salvarEstado } from './util/persistencia.js';
import path from 'node:path';
import pLimit from 'p-limit';
import { detectarFantasmas } from './fantasma.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import {
  gerarRelatorioPodaMarkdown,
  gerarRelatorioPodaJson,
} from '../relatorios/relatorio-poda.js';
import type { FileEntryWithAst, ResultadoPoda, Pendencia, HistoricoItem } from '../tipos/tipos.js';

export async function removerArquivosOrfaos(
  _fileEntries: FileEntryWithAst[] /*executarRealmente = false*/,
): Promise<ResultadoPoda> {
  const { fantasmas } = await detectarFantasmas();
  return { arquivosOrfaos: fantasmas };
}

function gerarPendencias(
  fantasmas: { arquivo: string; referenciado?: boolean }[],
  agora: number,
): Pendencia[] {
  return fantasmas.map((f) => ({
    arquivo: f.arquivo,
    motivo: f.referenciado ? 'inativo' : 'órfão',
    detectedAt: agora,
    scheduleAt: agora,
  }));
}

function mesclarPendencias(anteriores: Pendencia[], novos: Pendencia[]): Pendencia[] {
  const mapa = new Map<string, Pendencia>();
  for (const p of anteriores) mapa.set(p.arquivo, p);
  for (const p of novos) mapa.set(p.arquivo, p);
  return Array.from(mapa.values());
}

function dividirPendencias(
  pendencias: Pendencia[],
  reativar: string[],
  _agora: number,
): [Pendencia[], Pendencia[]] {
  const aManter: Pendencia[] = [];
  const aPodar: Pendencia[] = [];
  const reativarSet = new Set(reativar);
  for (const p of pendencias) {
    if (reativarSet.has(p.arquivo)) {
      aManter.push(p);
    } else {
      aPodar.push(p);
    }
  }
  return [aManter, aPodar];
}

const {
  AUTOANALISE_CONCURRENCY: CONCORRENCIA = 5,
  ZELADOR_ABANDONED_DIR: DIR_ABANDONADOS,
  ZELADOR_PENDING_PATH: PATH_PENDENTES,
  ZELADOR_REACTIVATE_PATH: PATH_REATIVAR,
  ZELADOR_HISTORY_PATH: PATH_HISTORICO,
  ZELADOR_REPORT_PATH: PATH_RELATORIO,
} = config;

export async function executarPodaCiclica(executarRealmente = false): Promise<void> {
  log.info('\n🌿 Iniciando poda automática...\n');

  if (!executarRealmente) {
    log.aviso('🧪 Modo de simulação ativado. Nenhum arquivo será movido.\n');
  }

  const base = process.cwd();
  const agora = Date.now();

  const [anteriores, reativar, historico] = await Promise.all([
    lerEstado<Pendencia[]>(PATH_PENDENTES),
    lerEstado<string[]>(PATH_REATIVAR),
    lerEstado<HistoricoItem[]>(PATH_HISTORICO),
  ]);

  const { fantasmas } = await detectarFantasmas();
  const novos = gerarPendencias(fantasmas, agora);
  const unicos = mesclarPendencias(anteriores, novos);
  const [aManter, aPodar] = dividirPendencias(unicos, reativar, agora);

  if (!aPodar.length) {
    log.sucesso('✅ Nenhum arquivo para podar neste ciclo.\n');
    await gerarRelatorioPodaMarkdown(PATH_RELATORIO.replace(/\.json$/, '.md'), aPodar, aManter, {
      simulado: !executarRealmente,
    });
    await gerarRelatorioPodaJson(PATH_RELATORIO, aPodar, aManter);
    return;
  }

  if (executarRealmente) {
    log.aviso(`⚠️ Podando ${aPodar.length} arquivos...`);
    await moverArquivos(aPodar, base, historico);
    await salvarEstado(PATH_PENDENTES, aManter);
    await salvarEstado(PATH_HISTORICO, historico);
    log.sucesso('🧹 Podagem concluída.');
  } else {
    moverArquivosSimulado(aPodar, base);
  }
}
function moverArquivosSimulado(lista: Pendencia[], base: string): void {
  log.info(`Simulando movimentação para ${DIR_ABANDONADOS}:\n`);
  for (const item of lista) {
    const destino = path.join(base, DIR_ABANDONADOS, item.arquivo);
    log.info(`  → SIMULADO: '${item.arquivo}' → '${path.relative(base, destino)}'`);
  }
  log.info('');
}

async function moverArquivos(
  lista: Pendencia[],
  base: string,
  historico: HistoricoItem[],
): Promise<void> {
  const limitar = pLimit(CONCORRENCIA);

  await Promise.all(
    lista.map((pend) =>
      limitar(async () => {
        const src = path.join(base, pend.arquivo);
        const dest = path.join(base, DIR_ABANDONADOS, pend.arquivo);
        try {
          await import('node:fs').then((fs) =>
            fs.promises.mkdir(path.dirname(dest), { recursive: true }),
          );
          await import('node:fs').then((fs) => fs.promises.rename(src, dest));
          historico.push({
            arquivo: pend.arquivo,
            movidoEm: new Date().toISOString(),
            motivo: pend.motivo,
          });
          log.sucesso(`✅ ${pend.arquivo} movido para abandonados.`);
        } catch (err) {
          log.erro(
            `❌ Falha ao mover ${pend.arquivo}: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`,
          );
        }
      }),
    ),
  );
}
