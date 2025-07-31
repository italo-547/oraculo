import { parse as babelParse, ParserOptions } from '@babel/parser';
import { File as BabelFile } from '@babel/types';
import { log } from './constelacao/log.js';

type ParserFunc = (codigo: string, plugins?: string[]) => Promise<BabelFile | null>;

async function parseComBabel(codigo: string, plugins?: string[]): Promise<BabelFile | null> {
  const options: ParserOptions = {
    sourceType: 'unambiguous',
    plugins: (plugins ?? ['typescript', 'jsx', 'decorators-legacy']) as any
  };

  try {
    return babelParse(codigo, options);
  } catch (err: any) {
    log.debug(`⚠️ Falha no parser Babel: ${err.message}`);
    return null;
  }
}

async function parseComKotlin(_codigo: string): Promise<null> {
  log.debug('🔧 Parser Kotlin ainda não implementado.');
  return null;
}

async function parseComJava(_codigo: string): Promise<null> {
  log.debug('🔧 Parser Java ainda não implementado.');
  return null;
}

async function parseComXml(_codigo: string): Promise<null> {
  log.debug('🔧 Parser XML ainda não implementado.');
  return null;
}

const PARSERS: Map<string, ParserFunc> = new Map([
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

interface DecifrarSintaxeOpts {
  plugins?: string[];
  timeoutMs?: number;
}

export async function decifrarSintaxe(
  codigo: string,
  ext: string,
  opts: DecifrarSintaxeOpts = {}
): Promise<BabelFile | null> {
  const parser = PARSERS.get(ext);
  if (!parser) {
    log.debug(`⚠️ Nenhum parser disponível para extensão: ${ext}`);
    return null;
  }

  const parsePromise = parser(codigo, opts.plugins);

  if (opts.timeoutMs) {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        log.debug(`⏱️ Parsing timeout após ${opts.timeoutMs}ms para extensão ${ext}`);
        resolve(null);
      }, opts.timeoutMs);
    });

    return Promise.race([parsePromise, timeoutPromise]) as Promise<BabelFile | null>;
  }

  return parsePromise;
}