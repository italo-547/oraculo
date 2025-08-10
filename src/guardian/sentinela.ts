import { promises as fs } from 'node:fs';
import path from 'node:path';
import { log } from '../nucleo/constelacao/log.js';
import { gerarSnapshotDoConteudo } from './hash.js';
import { carregarBaseline, salvarBaseline } from './baseline.js';
import { diffSnapshots, verificarErros } from './diff.js';
import { BASELINE_PATH } from './constantes.js';
import { IntegridadeStatus, GuardianError, FileEntry } from '../tipos/tipos.js';

type Snapshot = Record<string, string>;

function construirSnapshot(fileEntries: FileEntry[]): Snapshot {
  const snapshot: Snapshot = {};
  for (const { relPath, content } of fileEntries) {
    if (!content?.trim()) continue;
    try {
      snapshot[relPath] = gerarSnapshotDoConteudo(content);
<<<<<<< HEAD
    } catch (err) {
      log.aviso(`❌ Falha ao gerar hash de ${relPath}: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`);
=======
    } catch (err: any) {
      log.aviso(`❌ Falha ao gerar hash de ${relPath}: ${err.message}`);
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
    }
  }
  return snapshot;
}

export async function scanSystemIntegrity(
  fileEntries: FileEntry[],
  options?: { justDiff?: boolean }
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
<<<<<<< HEAD
  } catch (err) {
    log.aviso(`⚠️ Baseline inválido ou corrompido: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`);
=======
  } catch (err: any) {
    log.aviso(`⚠️ Baseline inválido ou corrompido: ${err.message}`);
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
  }

  const snapshotAtual = construirSnapshot(fileEntries);

  if (!baselineAnterior) {
    log.info(`[Guardian] 🆕 ${agora} — Baseline inicial criado.`);
    await salvarBaseline(snapshotAtual);
    return { status: IntegridadeStatus.Criado, timestamp: agora };
  }

  if (process.argv.includes('--aceitar')) {
    log.info(`[Guardian] ✅ ${agora} — Baseline aceito manualmente (--aceitar).`);
    await salvarBaseline(snapshotAtual);
    return { status: IntegridadeStatus.Aceito, timestamp: agora };
  }

  const diffs = diffSnapshots(baselineAnterior, snapshotAtual);
  const erros = verificarErros(diffs);

  if (options?.justDiff) {
    return {
      status: erros.length ? IntegridadeStatus.AlteracoesDetectadas : IntegridadeStatus.Ok,
      timestamp: agora,
      detalhes: erros
    };
  }

  if (erros.length) {
    throw new GuardianError(erros);
  }

  return { status: IntegridadeStatus.Ok, timestamp: agora };
}

export async function acceptNewBaseline(fileEntries: FileEntry[]): Promise<void> {
  const snapshotAtual = construirSnapshot(fileEntries);
  await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await salvarBaseline(snapshotAtual);
}