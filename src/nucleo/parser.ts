// SPDX-License-Identifier: MIT
import { parse as babelParse, ParserOptions } from '@babel/parser';
import { File as BabelFile } from '@babel/types';
// Parsers externos leves para outras linguagens
import { parseDocument } from 'htmlparser2';
import { XMLParser } from 'fast-xml-parser';
import * as csstree from 'css-tree';
import { createRequire } from 'module';
const localRequire = createRequire(import.meta.url);
import { log } from './constelacao/log.js';

// Mantemos a assinatura retornando BabelFile | null para não quebrar tipos externos, mas
// para linguagens não-Babel geramos um objeto "compat" mínimo com File/Program vazio
// e ast original em oraculoExtra.
interface BabelFileExtra extends BabelFile {
  oraculoExtra?: { lang: string; rawAst: unknown };
}
type ParserFunc = (codigo: string, plugins?: string[]) => BabelFile | BabelFileExtra | null;

function parseComBabel(codigo: string, plugins?: string[]): BabelFile | null {
  const defaultPlugins = ['typescript', 'jsx', 'decorators-legacy'];
  const options: ParserOptions = {
    sourceType: 'unambiguous',
    plugins: (Array.isArray(plugins) ? plugins : defaultPlugins) as ParserOptions['plugins'],
  };
  try {
    return babelParse(codigo, options);
  } catch (e) {
    // Mantém comportamento resiliente: parser inválido retorna null (testes esperam isso)
    log.debug(`⚠️ Erro de parsing Babel: ${(e as Error).message}`);
    return null;
  }
}

function wrapMinimal(lang: string, rawAst: unknown): BabelFileExtra {
  return {
    type: 'File',
    program: { type: 'Program', body: [], sourceType: 'script', directives: [] },
    comments: [],
    tokens: [],
    oraculoExtra: { lang, rawAst },
  };
}

function parseComKotlin(codigo: string) {
  // Heurística simples: extrai nomes de classes/objects/fun
  const classes = Array.from(codigo.matchAll(/\b(class|object|fun)\s+([A-Za-z0-9_]+)/g)).map(
    (m) => ({
      tipo: m[1],
      nome: m[2],
    }),
  );
  log.debug(`🧪 Kotlin pseudo-parse: ${classes.length} símbolos`);
  return wrapMinimal('kotlin', { symbols: classes });
}

function parseComJava(codigo: string) {
  try {
    // Lazy require: evita custo de import em ambientes que não analisam Java
    const { parse } = localRequire('java-parser');
    const ast = parse(codigo);
    log.debug('☕ Java parse realizado');
    return wrapMinimal('java', ast);
  } catch (e) {
    log.debug(`⚠️ Erro Java parse: ${(e as Error).message}`);
    return null;
  }
}

function parseComXml(codigo: string) {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });
    const ast = parser.parse(codigo);
    return wrapMinimal('xml', ast);
  } catch (e) {
    log.debug(`⚠️ Erro XML parse: ${(e as Error).message}`);
    return null;
  }
}

function parseComHtmlFunc(codigo: string) {
  try {
    const dom = parseDocument(codigo, { xmlMode: false });
    return wrapMinimal('html', dom);
  } catch (e) {
    log.debug(`⚠️ Erro HTML parse: ${(e as Error).message}`);
    return null;
  }
}

function parseComCss(codigo: string) {
  try {
    const ast = csstree.parse(codigo, { positions: false });
    return wrapMinimal('css', ast);
  } catch (e) {
    log.debug(`⚠️ Erro CSS parse: ${(e as Error).message}`);
    return null;
  }
}

function parseComGradle(codigo: string) {
  // Gradle Groovy/KTS – heurística simples
  const plugins = Array.from(codigo.matchAll(/id\s+['"]([A-Za-z0-9_.-]+)['"]/g)).map((m) => m[1]);
  const deps = Array.from(codigo.matchAll(/implementation\s+['"]([^'"]+)['"]/g)).map((m) => m[1]);
  return wrapMinimal('gradle', { plugins, deps });
}

export const PARSERS = new Map<string, ParserFunc>([
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

interface DecifrarSintaxeOpts {
  plugins?: string[];
  timeoutMs?: number;
}

export async function decifrarSintaxe(
  codigo: string,
  ext: string,
  opts: DecifrarSintaxeOpts = {},
): Promise<BabelFile | null> {
  const parser = PARSERS.get(ext);
  if (!parser) {
    log.debug(`⚠️ Nenhum parser disponível para extensão: ${ext}`);
    return null;
  }

  const parseResult = parser(codigo, opts.plugins);

  if (opts.timeoutMs) {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        log.debug(`⏱️ Parsing timeout após ${opts.timeoutMs}ms para extensão ${ext}`);
        resolve(null);
      }, opts.timeoutMs);
    });

    // Se o parser for síncrono, já temos o resultado imediatamente
    return Promise.race([Promise.resolve(parseResult), timeoutPromise]);
  }

  return Promise.resolve(parseResult);
}
