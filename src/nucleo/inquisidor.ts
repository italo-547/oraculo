import * as path from 'path';
import { scanRepository } from './scanner';
import { decifrarSintaxe } from './parser';
import { executarInquisicao } from './executor';
import { detectorEstrutura } from '../analistas/detector-estrutura';
import { detectorDependencias } from '../analistas/detector-dependencias';
import { log } from './constelacao/log';
import config from './constelacao/cosmos';
const EXTENSOES_COM_AST = new Set(config.SCANNER_EXTENSOES_COM_AST ?? ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const tecnicas = [
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
            ast,
            fullPath: entry.fullPath ?? path.resolve(baseDir, entry.relPath)
        };
    }));
}
async function iniciarInquisicao(baseDir = process.cwd(), options = {}) {
    const { includeContent = true, incluirMetadados = true } = options;
    log.info(`Iniciando a Inquisição do Oráculo em: ${baseDir}`);
    const fileMap = await scanRepository(baseDir, { includeContent });
    let fileEntries = Object.values(fileMap);
    if (incluirMetadados) {
        fileEntries = await prepararComAst(fileEntries, baseDir);
    }
    else {
        fileEntries = fileEntries.map(entry => ({ ...entry, ast: null, fullPath: entry.fullPath ?? path.resolve(baseDir, entry.relPath) }));
    }
    const { totalArquivos, ocorrencias } = await executarInquisicao(fileEntries,
    tecnicas, baseDir, undefined);
    log.sucesso(`Inquisição concluída. Total de ocorrências: ${ocorrencias.length}`);
    return { totalArquivos, ocorrencias, fileEntries: fileEntries };
}
export { executarInquisicao, tecnicas, iniciarInquisicao };
