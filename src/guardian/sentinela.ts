import { promises as fs } from 'node:fs';
import path from 'node:path';
import { log } from '../nucleo/constelacao/log';
import { gerarSnapshotDoConteudo } from './hash';
import { carregarBaseline, salvarBaseline } from './baseline';
import { diffSnapshots, verificarErros } from './diff';
import { BASELINE_PATH } from './constantes';
import { IntegridadeStatus, GuardianError } from '../tipos/tipos';
/**
 * Executa verificação de integridade dos arquivos analisados, comparando com baseline salvo.
 */
export async function scanSystemIntegrity(fileEntries) {
    const agora = new Date().toISOString();
    await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
    let baselineAnterior = null;
    try {
        baselineAnterior = await carregarBaseline();
    }
    catch (err) {
        log.aviso(`⚠️ Baseline inválido ou corrompido: ${err.message}`);
    }
    const snapshotAtual = {};
    for (const { relPath, content } of fileEntries) {
        if (!content?.trim())
            continue;
        try {
            snapshotAtual[relPath] = gerarSnapshotDoConteudo(content);
        }
        catch (err) {
            log.aviso(`❌ Falha ao gerar hash de ${relPath}: ${err.message}`);
        }
    }
    if (!baselineAnterior) {
        log.info(`[Guardian] 🆕 ${agora} — Baseline inicial criado.`);
        await salvarBaseline(snapshotAtual);
        return { status: IntegridadeStatus.Criado, timestamp: agora };
    }
    const aceitandoViaCLI = process.argv.includes('--aceitar');
    if (aceitandoViaCLI) {
        log.info(`[Guardian] ✅ ${agora} — Baseline aceito manualmente (--aceitar).`);
        await salvarBaseline(snapshotAtual);
        return { status: IntegridadeStatus.Aceito, timestamp: agora };
    }
    const diffs = diffSnapshots(baselineAnterior, snapshotAtual);
    const erros = verificarErros(diffs);
    /**
   * Aceita o snapshot atual como o novo baseline.
   */
    export async function acceptNewBaseline(fileEntries) {
        const agora = new Date().toISOString();
        const snapshotAtual = {};
        for (const { relPath, content } of fileEntries) {
            if (!content?.trim())
                continue;
            try {
                snapshotAtual[relPath] = gerarSnapshotDoConteudo(content);
            }
            catch (err) {
                log.aviso(`❌ Falha ao gerar hash de ${relPath}: ${err.message}`);
            }
        }
        log.info(`[Guardian] ✅ ${agora} — Novo baseline aceito manualmente.`);
        await salvarBaseline(snapshotAtual);
    }
    if (erros.length > 0) {
        log.erro(`\n🛑 [Guardian] Quebra de integridade detectada em ${erros.length} arquivo(s):`);
        for (const msg of erros) {
            log.erro(`  - ${msg}`);
        }
        log.erro(`\n💡 Se as mudanças forem legítimas, execute: oraculo guard --aceitar\n`);
        throw new GuardianError(erros);
    }
    log.info(`[Guardian] 🛡️ ${agora} — Nenhuma alteração crítica detectada. Integridade confirmada.`);
    return { status: IntegridadeStatus.Ok, timestamp: agora };
}
