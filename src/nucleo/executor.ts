//-----------------------------------
// 🧠 TIPOS ESSENCIAIS
// ----------------------------------
import { log } from './constelacao/log.js';
export async function executarInquisicao(fileEntriesComAst, tecnicas, baseDir, guardianResultado) {
    log.info('🧪 Iniciando execução das técnicas...\n');
    const arquivosAnalisadosCount = fileEntriesComAst.length;
    const arquivosValidosSet = new Set(fileEntriesComAst.map(f => f.relPath));
    const contextoGlobal = {
        baseDir,
        arquivos: fileEntriesComAst,
        ambiente: {
            arquivosValidosSet,
            guardian: guardianResultado
        },
    };
    const ocorrencias = [];
    const inicioExecucao = performance.now();
    // 🔵 Executa flags globais
    for (const tecnica of tecnicas) {
        if (tecnica.global) {
            const inicio = performance.now();
            try {
                const resultado = await tecnica.aplicar('', '', null, undefined, contextoGlobal);
                if (resultado) {
                    ocorrencias.push(...(Array.isArray(resultado) ? resultado : [resultado]));
                }
                const duracao = (performance.now() - inicio).toFixed(1);
                log.sucesso(`✅ Técnica global '${tecnica.nome}' executada em ${duracao}ms`);
            }
            catch (error) {
                log.erro(`❌ Erro na técnica global '${tecnica.nome}': ${error.message}`);
                error.stack && log.info(error.stack);
                ocorrencias.push({
                    tipo: 'erro',
                    nivel: 'aviso',
                    mensagem: `Falha na técnica global '${tecnica.nome}': ${error.message}`,
                    relPath: '[execução global]',
                    arquivo: '[execução global]',
                    linha: 0
                });
            }
        }
    }
    // 🟢 Executa técnicas por arquivo
    for (const entry of fileEntriesComAst) {
        for (const tecnica of tecnicas) {
            if (tecnica.global)
                continue;
            if (tecnica.test && !tecnica.test(entry.relPath))
                continue;
            const inicio = performance.now();
            try {
                const resultado = await tecnica.aplicar(entry.content ?? '', entry.relPath, entry.ast, entry.fullPath, contextoGlobal);
                if (resultado) {
                    ocorrencias.push(...(Array.isArray(resultado) ? resultado : [resultado]));
                }
                const duracao = (performance.now() - inicio).toFixed(1);
                log.info(`📄 '${tecnica.nome}' analisou ${entry.relPath} em ${duracao}ms`);
            }
            catch (error) {
                log.erro(`❌ Erro na técnica '${tecnica.nome}' em '${entry.relPath}': ${error.message}`);
                error.stack && log.info(error.stack);
                ocorrencias.push({
                    tipo: 'erro',
                    nivel: 'aviso',
                    mensagem: `Falha na técnica '${tecnica.nome}': ${error.message}`,
                    relPath: entry.relPath,
                    arquivo: entry.relPath,
                    linha: 0
                });
            }
        }
    }
    const fimExecucao = performance.now();
    const duracaoTotal = fimExecucao - inicioExecucao;
    log.info(`\n🧾 Execução concluída em ${duracaoTotal.toFixed(1)}ms`);
    log.sucesso(`🎯 ${ocorrencias.length} ocorrência(s) em ${arquivosAnalisadosCount} arquivo(s)\n`);
    return {
        totalArquivos: arquivosAnalisadosCount,
        ocorrencias,
        arquivosAnalisados: fileEntriesComAst.map(f => f.relPath).join(', '),
        fileEntries: fileEntriesComAst,
        timestamp: Date.now(),
        duracaoMs: duracaoTotal,
        guardian: guardianResultado
    };
}
