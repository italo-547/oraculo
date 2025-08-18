// SPDX-License-Identifier: MIT
import micromatch from 'micromatch';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import { FileEntry, GuardianError, IntegridadeStatus } from '../tipos/tipos.js';
import { carregarBaseline, salvarBaseline } from './baseline.js';
import { BASELINE_PATH } from './constantes.js';
import { diffSnapshots, verificarErros } from './diff.js';
import { gerarSnapshotDoConteudo } from './hash.js';

type Snapshot = Record<string, string>;

function construirSnapshot(fileEntries: FileEntry[]): Snapshot {
  const snapshot: Snapshot = {};
  for (const { relPath, content } of fileEntries) {
    if (typeof content !== 'string' || !content.trim()) continue;
    try {
      snapshot[relPath] = gerarSnapshotDoConteudo(content);
    } catch (err) {
      log.aviso(
        `x Falha ao gerar hash de ${relPath}: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`,
      );
    }
  }
  return snapshot;
}

export async function scanSystemIntegrity(
  fileEntries: FileEntry[],
  options?: { justDiff?: boolean; suppressLogs?: boolean },
): Promise<{
  status: IntegridadeStatus;
  timestamp: string;
  detalhes?: string[];
  baselineModificado?: boolean;
}> {
  const agora = new Date().toISOString();
  await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });

  let baselineAnterior: Snapshot | null = null;
  try {
    baselineAnterior = await carregarBaseline();
  } catch (err) {
    log.aviso(
      `⚠️ Baseline inválido ou corrompido: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`,
    );
  }

  // Filtra entradas conforme padrões ignorados específicos do Guardian
  const ignorados = config.GUARDIAN_IGNORE_PATTERNS || [];
  const filtrados = fileEntries.filter((f) => {
    const rel = f.relPath.replace(/\\/g, '/');
    return !micromatch.isMatch(rel, ignorados);
  });
  if (config.DEV_MODE) {
    const removidos = fileEntries.length - filtrados.length;
    log.info(
      `⚙️ Guardian filtro aplicado: ${filtrados.length} arquivos considerados (removidos ${removidos}).`,
    );
  }
  const snapshotAtual = construirSnapshot(filtrados);

  if (!baselineAnterior) {
    if (!options?.suppressLogs) {
      log.info(`🆕 Guardian: baseline inicial criado.`);
    }
    await salvarBaseline(snapshotAtual);
    return { status: IntegridadeStatus.Criado, timestamp: agora };
  }

  if (process.argv.includes('--aceitar')) {
    if (!options?.suppressLogs) {
      log.info(`✅ Guardian: baseline aceito manualmente (--aceitar).`);
    }
    await salvarBaseline(snapshotAtual);
    return { status: IntegridadeStatus.Aceito, timestamp: agora };
  }

  const diffs = diffSnapshots(baselineAnterior, snapshotAtual);
  const erros = verificarErros(diffs);

  if (options?.justDiff) {
    return {
      status: erros.length ? IntegridadeStatus.AlteracoesDetectadas : IntegridadeStatus.Ok,
      timestamp: agora,
      detalhes: erros,
    };
  }

  if (erros.length) {
    throw new GuardianError(erros);
  }

  return { status: IntegridadeStatus.Ok, timestamp: agora };
}

export async function acceptNewBaseline(fileEntries: FileEntry[]): Promise<void> {
  const ignorados = config.GUARDIAN_IGNORE_PATTERNS || [];
  const filtrados = fileEntries.filter((f) => {
    const rel = f.relPath.replace(/\\/g, '/');
    return !micromatch.isMatch(rel, ignorados);
  });
  const snapshotAtual = construirSnapshot(filtrados);
  await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await salvarBaseline(snapshotAtual);
}
