import { log } from '../nucleo/constelacao/log.js';
import { estatisticasUsoGlobal } from '../analistas/analista-padroes-uso.js';
/**
 * Emite um relatório sobre a saúde do código com base nas estatísticas gerais.
 */
export function exibirRelatorioZeladorSaude(ocorrencias) {
    const constExcessivas = Object.entries(estatisticasUsoGlobal.consts).filter(([, n]) => n > 3);
    const requireRepetidos = Object.entries(estatisticasUsoGlobal.requires).filter(([, n]) => n > 3);
    log.info('\\n🧼 Relatório de Saúde do Código:\\n');
    if (ocorrencias.length > 0) {
        log.aviso('⚠️ Funções longas encontradas:');
        for (const o of ocorrencias) {
            log.aviso(`  - [${o.relPath}:${o.linha}] ${o.mensagem}`);
        }
        log.info('');
    }
    else {
        log.sucesso('✅ Nenhuma função acima do limite.\\n');
    }
    if (constExcessivas.length > 0) {
        log.info('🔁 Constantes definidas mais de 3 vezes:');
        for (const [nome, qtd] of constExcessivas) {
            log.info(`  - ${nome}: ${qtd} vez(es)`);
        }
        log.info('');
    }
    if (requireRepetidos.length > 0) {
        log.info('📦 Módulos require utilizados mais de 3 vezes:');
        for (const [nome, qtd] of requireRepetidos) {
            log.info(`  - ${nome}: ${qtd} vez(es)`);
        }
        log.info('');
    }
    log.sucesso('✅ Fim do relatório do zelador.\\n');
}
