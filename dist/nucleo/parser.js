import { parse as babelParse } from '@babel/parser';
import { log } from './constelacao/log.js';
async function parseComBabel(codigo, plugins) {
    const options = {
        sourceType: 'unambiguous',
        plugins: plugins ?? ['typescript', 'jsx', 'decorators-legacy']
    };
    try {
        return babelParse(codigo, options);
    }
    catch (err) {
        log.debug(`⚠️ Falha no parser Babel: ${err.message}`);
        return null;
    }
}
async function parseComKotlin(_codigo) {
    log.debug('🔧 Parser Kotlin ainda não implementado.');
    return null;
}
async function parseComJava(_codigo) {
    log.debug('🔧 Parser Java ainda não implementado.');
    return null;
}
async function parseComXml(_codigo) {
    log.debug('🔧 Parser XML ainda não implementado.');
    return null;
}
const PARSERS = new Map([
    ['.js', parseComBabel],
    ['.jsx', parseComBabel],
    ['.ts', parseComBabel],
    ['.tsx', parseComBabel],
    ['.mjs', parseComBabel],
    ['.cjs', parseComBabel],
    ['.kt', parseComKotlin],
    ['.kts', parseComKotlin],
    ['.java', parseComJava],
    ['.xml', parseComXml]
]);
export const EXTENSOES_SUPORTADAS = Array.from(PARSERS.keys());
export async function decifrarSintaxe(codigo, ext, opts = {}) {
    const parser = PARSERS.get(ext);
    if (!parser) {
        log.debug(`⚠️ Nenhum parser disponível para extensão: ${ext}`);
        return null;
    }
    const parsePromise = parser(codigo, opts.plugins);
    if (opts.timeoutMs) {
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                log.debug(`⏱️ Parsing timeout após ${opts.timeoutMs}ms para extensão ${ext}`);
                resolve(null);
            }, opts.timeoutMs);
        });
        return Promise.race([parsePromise, timeoutPromise]);
    }
    return parsePromise;
}
