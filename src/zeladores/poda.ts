import { promises as fs } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import { detectarFantasmas } from './fantasma';
import config from '../nucleo/constelacao/cosmos';
import { log } from '../nucleo/constelacao/log';
const { AUTOANALISE_CONCURRENCY: CONCORRENCIA = 5, GHOST_FILE_INACTIVITY_DAYS: DIAS_INATIVOS = 30, DIR_ABANDONADOS = '.oraculo/abandonados', PATH_PENDENTES = '.oraculo/pendentes.json', PATH_REATIVAR = '.oraculo/reativar.json', PATH_HISTORICO = '.oraculo/historico.json', PATH_RELATORIO = '.oraculo/poda-oracular.md' } = config;
const MILIS_DIA = 86_400_000;
/** Entrada principal da poda */
export async function executarPodaCiclica(executarRealmente = false) {
    log.info('\n🌿 Iniciando poda automática...\n');
    if (!executarRealmente) {
        log.aviso('🧪 Modo de simulação ativado. Nenhum arquivo será movido.\n');
    }
    const base = process.cwd();
    const agora = Date.now();
    const [anteriores, reativar, historico] = await Promise.all([
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
        await gerarRelatorio(PATH_RELATORIO, aPodar, aManter);
        return;
    }
    if (executarRealmente) {
        log.aviso(`⚠️ Podando ${aPodar.length} arquivos...`);
        await moverArquivos(aPodar, base, historico);
        await salvarEstado(PATH_PENDENTES, aManter);
        await salvarEstado(PATH_HISTORICO, historico);
        log.sucesso('🧹 Podagem concluída.');
    }
    else {
        await moverArquivosSimulado(aPodar, base);
    }
    await gerarRelatorio(PATH_RELATORIO, aPodar, aManter);
    log.sucesso(`📄 Relatório salvo em: ${path.relative(base, PATH_RELATORIO)}\n`);
}
/** Simula movimentação dos arquivos para o diretório de abandonados */
async function moverArquivosSimulado(lista, base) {
    log.info(`Simulando movimentação para ${DIR_ABANDONADOS}:\n`);
    for (const item of lista) {
        const destino = path.join(base, DIR_ABANDONADOS, item.arquivo);
        log.info(`  → SIMULADO: '${item.arquivo}' → '${path.relative(base, destino)}'`);
    }
    log.info('');
}
/** Move arquivos para o diretório de abandonados */
async function moverArquivos(lista, base, historico) {
    const limitar = pLimit(CONCORRENCIA);
    await Promise.all(lista.map(pend => limitar(async () => {
        const src = path.join(base, pend.arquivo);
        let dest = path.join(base, DIR_ABANDONADOS, pend.arquivo);
        try {
            await fs.mkdir(path.dirname(dest), { recursive: true });
            if (await existe(dest)) {
                const sufixo = Date.now();
                const { name, ext } = path.parse(dest);
                dest = path.join(path.dirname(dest), `${name}-${sufixo}${ext}`);
            }
            await fs.rename(src, dest);
            historico.push({
                arquivo: pend.arquivo,
                movidoEm: new Date().toISOString().slice(0, 10),
                motivo: pend.motivo
            });
            log.sucesso(`📦 '${pend.arquivo}' → ${path.relative(base, dest)}`);
        }
        catch (err) {
            log.erro(`❌ Falha ao mover ${pend.arquivo}: ${err.message}`);
        }
    })));
}
/** Remove arquivos órfãos do sistema */
export async function removerArquivosOrfaos(fileEntries, realmenteRemover = false) {
    const arquivosOrfaos = [];
    const arquivosParaRemover = fileEntries
        .filter(file => file.relPath.includes('temp') || file.relPath.includes('lixo'))
        .map(file => file.relPath);
    if (realmenteRemover) {
        for (const arquivo of arquivosParaRemover) {
            try {
                await fs.unlink(arquivo);
                log.info(`Arquivo removido: ${arquivo}`);
            }
            catch (err) {
                log.erro(`Falha ao remover arquivo ${arquivo}: ${err.message}`);
            }
        }
    }
    return { arquivosOrfaos: arquivosParaRemover };
}
async function gerarRelatorio(caminho, podados, pendentes) {
    const hoje = new Date().toLocaleDateString();
    const linhas = [
        `# 🌿 Relatório de Podagem — ${hoje}`,
        ``,
        `## Arquivos Podados (${podados.length})`,
        ...podados.map(i => `- \`${i.arquivo}\` (${i.motivo})`),
        ``,
        `## Pendentes (${pendentes.length})`,
        ...pendentes.map(i => `- \`${i.arquivo}\` até ${new Date(i.scheduleAt).toLocaleDateString()}`),
        ``
    ];
    await fs.mkdir(path.dirname(caminho), { recursive: true });
    await fs.writeFile(caminho, linhas.join('\n'), 'utf-8');
}
function gerarPendencias(fantasmas, agora) {
    return fantasmas.map(f => ({
        arquivo: f.arquivo,
        motivo: f.referenciado ? 'inatividade' : 'não referenciado',
        detectedAt: agora,
        scheduleAt: agora + DIAS_INATIVOS * MILIS_DIA
    }));
}
function mesclarPendencias(...listas) {
    const mapa = new Map();
    for (const item of listas.flat()) {
        const atual = mapa.get(item.arquivo);
        if (!atual || item.detectedAt < atual.detectedAt) {
            mapa.set(item.arquivo, item);
        }
    }
    return [...mapa.values()];
}
function dividirPendencias(pendencias, reativar, agora) {
    const manter = [];
    const podar = [];
    for (const p of pendencias) {
        if (reativar.includes(p.arquivo))
            continue;
        p.scheduleAt > agora ? manter.push(p) : podar.push(p);
    }
    return [manter, podar];
}
async function existe(caminho) {
    try {
        await fs.access(caminho);
        return true;
    }
    catch {
        return false;
    }
}
async function lerEstado(caminho) {
    try {
        const txt = await fs.readFile(caminho, 'utf-8');
        return JSON.parse(txt);
    }
    catch {
        return [];
    }
}
async function salvarEstado(caminho, dados) {
    await fs.mkdir(path.dirname(caminho), { recursive: true });
    await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}
