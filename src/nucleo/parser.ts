import { parse as babelParse, ParserOptions } from '@babel/parser';
import { File as BabelFile } from '@babel/types';
import { log } from './constelacao/log.js';

type ParserFunc = (codigo: string, plugins?: string[]) => Promise<BabelFile | null>;

<<<<<<< HEAD
function parseComBabel(codigo: string, plugins?: string[]): Promise<BabelFile | null> {
  const defaultPlugins = ['typescript', 'jsx', 'decorators-legacy'];
  const options: ParserOptions = {
    sourceType: 'unambiguous',
    plugins: (Array.isArray(plugins) ? plugins : defaultPlugins) as ParserOptions['plugins']
  };

  try {
    return Promise.resolve(babelParse(codigo, options));
  } catch (err) {
    log.debug(`⚠️ Falha no parser Babel: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`);
    return Promise.resolve(null);
  }
}

function parseComKotlin(_codigo: string): Promise<null> {
  log.debug('🔧 Parser Kotlin ainda não implementado.');
  return Promise.resolve(null);
}

function parseComJava(_codigo: string): Promise<null> {
  log.debug('🔧 Parser Java ainda não implementado.');
  return Promise.resolve(null);
}

function parseComXml(_codigo: string): Promise<null> {
  log.debug('🔧 Parser XML ainda não implementado.');
  return Promise.resolve(null);
=======
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
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
}

const PARSERS = new Map<string, ParserFunc>([
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

    return Promise.race([parsePromise, timeoutPromise]);
  }

  return parsePromise;
}