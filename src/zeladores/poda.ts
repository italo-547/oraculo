import { gerarRelatorioPodaMarkdown, gerarRelatorioPodaJson } from '../relatorios/relatorio-poda.js';
// --- Funções utilitárias mínimas para // persistência e manipulação de pendênc
async function lerEstado<T = any>(caminho: string): Promise<T> {
  try {
    const conteudo = await fs.readFile(caminho, 'utf-8');
    return JSON.parse(conteudo);
  } catch {
    return [] as any;
  }
}

async function salvarEstado<T = any>(caminho: string, dados: T): Promise<void> {
  await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

function gerarPendencias(fantasmas: any[], agora: number): Pendencia[] {
  return fantasmas.map(f => ({
    arquivo: f.arquivo,
    motivo: f.referenciado ? 'inativo' : 'órfão',
    detectedAt: agora,
    scheduleAt: agora
  }));
}

function mesclarPendencias(anteriores: Pendencia[], novos: Pendencia[]): Pendencia[] {
  const mapa = new Map<string, Pendencia>();
  for (const p of anteriores) mapa.set(p.arquivo, p);
  for (const p of novos) mapa.set(p.arquivo, p);
  return Array.from(mapa.values());
}

function dividirPendencias(pendencias: Pendencia[], reativar: string[], agora: number): [Pendencia[], Pendencia[]] {
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
import { promises as fs } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import { detectarFantasmas } from './fantasma.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import type { Pendencia, HistoricoItem } from '../tipos/tipos.js';

const {
  AUTOANALISE_CONCURRENCY: CONCORRENCIA = 5,
  ZELADOR_GHOST_INACTIVITY_DAYS: DIAS_INATIVOS = 30,
  ZELADOR_ABANDONED_DIR: DIR_ABANDONADOS,
  ZELADOR_PENDING_PATH: PATH_PENDENTES,
  ZELADOR_REACTIVATE_PATH: PATH_REATIVAR,
  ZELADOR_HISTORY_PATH: PATH_HISTORICO,
  ZELADOR_REPORT_PATH: PATH_RELATORIO
} = config;

const MILIS_DIA = 86_400_000;

/**
 * Entrada principal da poda.
 */
export async function executarPodaCiclica(executarRealmente = false): Promise<void> {
  log.info('\n🌿 Iniciando poda automática...\n');

  if (!executarRealmente) {
    log.aviso('🧪 Modo de simulação ativado. Nenhum arquivo será movido.\n');
  }

  const base = process.cwd();
  const agora = Date.now();

  const [anteriores, reativar, historico]: [Pendencia[], string[], HistoricoItem[]] =
    await Promise.all([
      lerEstado(PATH_PENDENTES),
      lerEstado(PATH_REATIVAR),
      lerEstado(PATH_HISTORICO)
    ]);

  const { fantasmas } = await detectarFantasmas();
  const novos = gerarPendencias(fantasmas, agora);
  const unicos = mesclarPendencias(anteriores, novos);
  const [aManter, aPodar] = dividirPendencias(unicos, reativar, agora);

  if (!aPodar.length) {
    log.sucesso('✅ Nenhum arquivo para podar neste ciclo.\n');
    await gerarRelatorioPodaMarkdown(PATH_RELATORIO.replace(/\.json$/, '.md'), aPodar, aManter, { simulado: !executarRealmente });
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
    await moverArquivosSimulado(aPodar, base);
  }

  // Relatórios já gerados acima
}

// Funções auxiliares — você pode mover para util/poda.ts depois

async function moverArquivosSimulado(lista: Pendencia[], base: string): Promise<void> {
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
  historico: HistoricoItem[]
): Promise<void> {
  const limitar = pLimit(CONCORRENCIA);

  await Promise.all(
    lista.map(pend =>
      limitar(async () => {
        const src = path.join(base, pend.arquivo);
        const dest = path.join(base, DIR_ABANDONADOS, pend.arquivo);
        try {
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.rename(src, dest);
          historico.push({
            arquivo: pend.arquivo,
            movidoEm: new Date().toISOString(),
            motivo: pend.motivo
          });
          log.sucesso(`✅ ${pend.arquivo} movido para abandonados.`);
        } catch (err: any) {
          log.erro(`❌ Falha ao mover ${pend.arquivo}: ${err.message}`);
        }
      })
    )
  );
}