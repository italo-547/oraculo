import { parse as babelParse, ParserOptions } from '@babel/parser';
import { File as BabelFile } from '@babel/types';
import { log } from './constelacao/log.js';

type ParserFunc = (codigo: string, plugins?: string[]) => BabelFile | null;

function parseComBabel(codigo: string, plugins?: string[]): BabelFile | null {
  const defaultPlugins = ['typescript', 'jsx', 'decorators-legacy'];
  const options: ParserOptions = {
    sourceType: 'unambiguous',
    plugins: (Array.isArray(plugins) ? plugins : defaultPlugins) as ParserOptions['plugins'],
  };

  try {
    return babelParse(codigo, options);
  } catch (err) {
    log.debug(
      `⚠️ Falha no parser Babel: ${typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : String(err)}`,
    );
    return null;
  }
}

function parseComKotlin(_codigo: string): null {
  log.debug('🔧 Parser Kotlin ainda não implementado.');
  return null;
}

function parseComJava(_codigo: string): null {
  log.debug('🔧 Parser Java ainda não implementado.');
  return null;
}

function parseComXml(_codigo: string): null {
  log.debug('🔧 Parser XML ainda não implementado.');
  return null;
}

export const PARSERS = new Map<string, ParserFunc>([
  ['.js', parseComBabel],
  ['.jsx', parseComBabel],
  ['.ts', parseComBabel],
  ['.tsx', parseComBabel],
  ['.mjs', parseComBabel],
  ['.cjs', parseComBabel],
  ['.kt', parseComKotlin],
  ['.kts', parseComKotlin],
  ['.java', parseComJava],
  ['.xml', parseComXml],
]);

export const EXTENSOES_SUPORTADAS = Array.from(PARSERS.keys());

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
