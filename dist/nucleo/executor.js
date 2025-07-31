import { log } from './constelacao/log.js';
export async function executarInquisicao(fileEntriesComAst, tecnicas, baseDir, guardianResultado) {
    log.info('🧪 Iniciando execução das técnicas...\n');
    const arquivosValidosSet = new Set(fileEntriesComAst.map(f => f.relPath));
    const contextoGlobal = {
        baseDir,
        arquivos: fileEntriesComAst,
        ambiente: {
            arquivosValidosSet,
            guardian: guardianResultado
        }
    };
    const ocorrencias = [];
    const inicioExecucao = performance.now();
    // 🔵 Técnicas globais
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
                if (error.stack)
                    log.info(error.stack);
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
    // 🟢 Técnicas por arquivo
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
                log.erro(`❌ Erro em '${tecnica.nome}' para ${entry.relPath}: ${error.message}`);
                if (error.stack)
                    log.info(error.stack);
                ocorrencias.push({
                    tipo: 'erro',
                    nivel: 'erro',
                    mensagem: `Falha na técnica '${tecnica.nome}' para ${entry.relPath}: ${error.message}`,
                    relPath: entry.relPath,
                    arquivo: entry.relPath,
                    linha: 0
                });
            }
        }
    }
    const fimExecucao = performance.now();
    const duracaoMs = Math.round(fimExecucao - inicioExecucao);
    return {
        totalArquivos: fileEntriesComAst.length,
        arquivosAnalisados: fileEntriesComAst.map(e => e.relPath),
        ocorrencias,
        timestamp: Date.now(),
        duracaoMs
    };
}
