import * as path from 'path';
import { scanRepository } from './scanner.js';
import { decifrarSintaxe } from './parser.js';
import { executarInquisicao as executarExecucao } from './executor.js';
import { detectorEstrutura } from '../analistas/detector-estrutura.js';
import { detectorDependencias } from '../analistas/detector-dependencias.js';
import { log } from './constelacao/log.js';
import { config } from './constelacao/cosmos.js';
const EXTENSOES_COM_AST = new Set(config.SCANNER_EXTENSOES_COM_AST ?? ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
export const tecnicas = [
    detectorDependencias,
    detectorEstrutura
];
async function prepararComAst(entries, baseDir) {
    return Promise.all(entries.map(async (entry) => {
        let ast = null;
        const ext = path.extname(entry.relPath);
        if (entry.content && EXTENSOES_COM_AST.has(ext)) {
            try {
                ast = await decifrarSintaxe(entry.content, ext);
            }
            catch (e) {
                log.erro(`Falha ao gerar AST para ${entry.relPath}: ${e.message}`);
            }
        }
        return {
            ...entry,
            ast: ast, // garante compatibilidade
            fullPath: entry.fullPath ?? path.resolve(baseDir, entry.relPath)
        };
    }));
}
export async function iniciarInquisicao(baseDir = process.cwd(), options = {}) {
    const { includeContent = true, incluirMetadados = true } = options;
    log.info(`🔍 Iniciando a Inquisição do Oráculo em: ${baseDir}`);
    const fileMap = await scanRepository(baseDir, { includeContent });
    let fileEntries;
    if (incluirMetadados) {
        fileEntries = await prepararComAst(Object.values(fileMap), baseDir);
    }
    else {
        fileEntries = Object.values(fileMap).map((entry) => ({
            ...entry,
            ast: undefined,
            fullPath: entry.fullPath ?? path.resolve(baseDir, entry.relPath)
        }));
    }
    // Agora fileEntries é FileEntryWithAst[]
    const { totalArquivos, ocorrencias } = await executarExecucao(fileEntries, tecnicas, baseDir, undefined);
    log.sucesso(`🔮 Inquisição concluída. Total de ocorrências: ${ocorrencias.length}`);
    return {
        totalArquivos,
        ocorrencias,
        arquivosAnalisados: fileEntries.map(f => f.relPath),
        timestamp: Date.now(),
        duracaoMs: 0,
        fileEntries,
        guardian: undefined
    };
}
export { executarExecucao as executarInquisicao };
