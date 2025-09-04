// SPDX-License-Identifier: MIT
import { parse as babelParse } from '@babel/parser';
// Parsers externos leves para outras linguagens
import { parseDocument } from 'htmlparser2';
import { XMLParser } from 'fast-xml-parser';
import * as csstree from 'css-tree';
import { createRequire } from 'module';
const localRequire = createRequire(import.meta.url);
import { log } from '@nucleo/constelacao/log.js';
function parseComBabel(codigo, plugins) {
    // Plugins padrão ampliados para cobrir padrões amplamente usados em node_modules
    const defaultPlugins = [
        'typescript',
        'jsx',
        'decorators-legacy',
        // Suporte a import attributes/assertions modernos
        'importAttributes',
        'importAssertions',
        // Class fields/methods private (comuns em libs modernas)
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'optionalChaining',
        'nullishCoalescingOperator',
        'topLevelAwait',
    ];
    const options = {
        sourceType: 'unambiguous',
        plugins: (Array.isArray(plugins) ? plugins : defaultPlugins),
    };
    try {
        return babelParse(codigo, options);
    }
    catch (e) {
        // Mantém comportamento resiliente: parser inválido retorna null (testes esperam isso)
        log.debug(`⚠️ Erro de parsing Babel: ${e.message}`);
        return null;
    }
}
function wrapMinimal(lang, rawAst) {
    return {
        type: 'File',
        program: { type: 'Program', body: [], sourceType: 'script', directives: [] },
        comments: [],
        tokens: [],
        oraculoExtra: { lang, rawAst },
    };
}
function parseComKotlin(codigo) {
    // Heurística simples: extrai nomes de classes/objects/fun
    const classes = Array.from(codigo.matchAll(/\b(class|object|fun)\s+([A-Za-z0-9_]+)/g)).map((m) => ({
        tipo: m[1],
        nome: m[2],
    }));
    log.debug(`🧪 Kotlin pseudo-parse: ${classes.length} símbolos`);
    return wrapMinimal('kotlin', { symbols: classes });
}
function parseComJava(codigo) {
    try {
        // Lazy require: evita custo de import em ambientes que não analisam Java
        const { parse } = localRequire('java-parser');
        const ast = parse(codigo);
        log.debug('☕ Java parse realizado');
        return wrapMinimal('java', ast);
    }
    catch (e) {
        log.debug(`⚠️ Erro Java parse: ${e.message}`);
        return null;
    }
}
function parseComTypeScript(codigo, tsx = false) {
    try {
        // Lazy require para reduzir custo quando não necessário
        const ts = localRequire('typescript');
        const sf = ts.createSourceFile(tsx ? 'file.tsx' : 'file.ts', codigo, ts.ScriptTarget.Latest, 
        /*setParentNodes*/ false, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        // Retorna AST do TS como extra; suficiente para gerar sentinel no pipeline
        return wrapMinimal(tsx ? 'tsx-tsc' : 'ts-tsc', {
            kind: sf.kind,
            statements: sf.statements?.length ?? 0,
        });
    }
    catch (e) {
        log.debug(`⚠️ Erro TS compiler parse: ${e.message}`);
        return null;
    }
}
function parseComXml(codigo) {
    try {
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });
        const ast = parser.parse(codigo);
        return wrapMinimal('xml', ast);
    }
    catch (e) {
        log.debug(`⚠️ Erro XML parse: ${e.message}`);
        return null;
    }
}
function parseComHtmlFunc(codigo) {
    try {
        const dom = parseDocument(codigo, { xmlMode: false });
        return wrapMinimal('html', dom);
    }
    catch (e) {
        log.debug(`⚠️ Erro HTML parse: ${e.message}`);
        return null;
    }
}
function parseComCss(codigo) {
    try {
        const ast = csstree.parse(codigo, { positions: false });
        return wrapMinimal('css', ast);
    }
    catch (e) {
        log.debug(`⚠️ Erro CSS parse: ${e.message}`);
        return null;
    }
}
function parseComGradle(codigo) {
    // Gradle Groovy/KTS – heurística simples
    const plugins = Array.from(codigo.matchAll(/id\s+['"]([A-Za-z0-9_.-]+)['"]/g)).map((m) => m[1]);
    const deps = Array.from(codigo.matchAll(/implementation\s+['"]([^'"]+)['"]/g)).map((m) => m[1]);
    return wrapMinimal('gradle', { plugins, deps });
}
export const PARSERS = new Map([
    ['.js', parseComBabel],
    ['.jsx', parseComBabel],
    ['.ts', parseComBabel],
    ['.tsx', parseComBabel],
    ['.mjs', parseComBabel],
    ['.cjs', parseComBabel],
    // Evitamos .d.ts explicitamente: não há AST útil para nossas análises
    ['.d.ts', () => null],
    ['.kt', parseComKotlin],
    ['.kts', parseComKotlin],
    ['.java', parseComJava],
    ['.xml', parseComXml],
    ['.html', parseComHtmlFunc],
    ['.htm', parseComHtmlFunc],
    ['.css', parseComCss],
    ['.gradle', parseComGradle],
    ['.gradle.kts', parseComGradle],
]);
export const EXTENSOES_SUPORTADAS = Array.from(PARSERS.keys()).filter((ext) => ext !== '.d.ts');
export async function decifrarSintaxe(codigo, ext, opts = {}) {
    const parser = PARSERS.get(ext);
    if (!parser) {
        log.debug(`⚠️ Nenhum parser disponível para extensão: ${ext}`);
        return null;
    }
    // Primeira tentativa com plugins padrão (ou fornecidos)
    let parseResult = parser(codigo, opts.plugins);
    // Fallbacks específicos para .js/.mjs: tentar Flow quando a primeira tentativa falhar
    if (parseResult == null && (ext === '.js' || ext === '.mjs' || ext === '.cjs')) {
        try {
            // Heurística rápida: detecta uso de Flow
            const pareceFlow = /@flow\b/.test(codigo) || /\bimport\s+type\b/.test(codigo);
            if (pareceFlow) {
                const flowPlugins = [
                    'flow',
                    'jsx',
                    'decorators-legacy',
                    'importAttributes',
                    'importAssertions',
                    'classProperties',
                    'classPrivateProperties',
                    'classPrivateMethods',
                    'optionalChaining',
                    'nullishCoalescingOperator',
                    'topLevelAwait',
                ];
                parseResult = parseComBabel(codigo, flowPlugins);
            }
            // Se ainda nulo e não parece Flow, tenta um conjunto "JS moderno" sem TypeScript (para .js puros)
            if (parseResult == null) {
                const jsModernPlugins = [
                    'jsx',
                    'decorators-legacy',
                    'importAttributes',
                    'importAssertions',
                    'classProperties',
                    'classPrivateProperties',
                    'classPrivateMethods',
                    'optionalChaining',
                    'nullishCoalescingOperator',
                    'topLevelAwait',
                ];
                parseResult = parseComBabel(codigo, jsModernPlugins);
            }
        }
        catch {
            // mantém null
        }
    }
    // Fallback usando TypeScript compiler quando Babel falhar em .ts/.tsx
    if (parseResult == null && (ext === '.ts' || ext === '.tsx')) {
        const tsx = ext === '.tsx';
        const tsParsed = parseComTypeScript(codigo, tsx);
        if (tsParsed)
            return Promise.resolve(tsParsed);
    }
    if (opts.timeoutMs) {
        return (async () => {
            let timer = null;
            try {
                const race = Promise.race([
                    Promise.resolve(parseResult),
                    new Promise((resolve) => {
                        timer = setTimeout(() => {
                            log.debug(`⏱️ Parsing timeout após ${opts.timeoutMs}ms para extensão ${ext}`);
                            resolve(null);
                        }, opts.timeoutMs);
                    }),
                ]);
                return await race;
            }
            finally {
                if (timer)
                    clearTimeout(timer);
            }
        })();
    }
    return Promise.resolve(parseResult);
}
//# sourceMappingURL=parser.js.map