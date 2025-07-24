import { log } from '../nucleo/constelacao/log.js';
import { globalCodeStats } from '../analista-padroes-uso.js';
export function exibirRelatorioZeladorSaude(ocorrencias) {
    const constExcessivas = Object.entries(globalCodeStats.constCount).filter(([, n]) => n > 3);
    const requireRepetidos = Object.entries(globalCodeStats.reqCount).filter(([, n]) => n > 3);
    log.info('\n🧼 Relatório de Saúde do Código:\n');
    // Funções longas
    if (ocorrencias.length > 0) {
        log.aviso('⚠️ Funções longas encontradas:');
        for (const o of ocorrencias) {
            log.aviso(`  - [${o.relPath}:${o.linha}] ${o.mensagem}`);
        }
        log.info('');
    }
    else {
        log.sucesso('✅ Nenhuma função acima do limite.\n');
    }
    // Constantes repetidas
    if (constExcessivas.length > 0) {
        log.info('🔁 Constantes definidas mais de 3 vezes:');
        for (const [nome, qtd] of constExcessivas) {
            log.info(`  - ${nome}: ${qtd} vez(es)`);
        }
        log.info('');
    }
    // Requires repetidos
    if (requireRepetidos.length > 0) {
        log.info('📦 Módulos require utilizados mais de 3 vezes:');
        for (const [nome, qtd] of requireRepetidos) {
            log.info(`  - ${nome}: ${qtd} vez(es)`);
        }
        log.info('');
    }
    log.sucesso('✅ Fim do relatório do zelador.\n');
}
