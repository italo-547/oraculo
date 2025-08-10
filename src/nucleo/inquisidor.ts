import * as path from 'path';
import { scanRepository } from './scanner.js';
import { decifrarSintaxe } from './parser.js';
import { executarInquisicao as executarExecucao } from './executor.js';
import { detectorEstrutura } from '../analistas/detector-estrutura.js';
import { detectorDependencias } from '../analistas/detector-dependencias.js';
import { log } from './constelacao/log.js';
import { config } from './constelacao/cosmos.js';

import type {
  FileEntryWithAst,
  FileEntry,
  InquisicaoOptions,
  Tecnica,
  ResultadoInquisicaoCompleto
} from '../tipos/tipos.js';

const EXTENSOES_COM_AST = new Set(
<<<<<<< HEAD
  Array.isArray(config.SCANNER_EXTENSOES_COM_AST) ? config.SCANNER_EXTENSOES_COM_AST : ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
=======
  config.SCANNER_EXTENSOES_COM_AST ?? ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
);

export const tecnicas: Tecnica[] = [
  detectorDependencias,
  detectorEstrutura
];

async function prepararComAst(
  entries: FileEntry[],
  baseDir: string
): Promise<FileEntryWithAst[]> {
  return Promise.all(
    entries.map(async (entry): Promise<FileEntryWithAst> => {
      let ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined = undefined;
      const ext = path.extname(entry.relPath);

      if (entry.content && EXTENSOES_COM_AST.has(ext)) {
        try {
          const parsed = await decifrarSintaxe(entry.content, ext);
          if (
            parsed &&
            typeof parsed === 'object' &&
            'node' in parsed &&
            'parent' in parsed
          ) {
            ast = (parsed as unknown) as import('@babel/traverse').NodePath<import('@babel/types').Node>;
          } else {
            ast = undefined;
          }
        } catch (e) {
          const err = e as Error;
          log.erro(`Falha ao gerar AST para ${entry.relPath}: ${err.message}`);
        }
      }

      return {
        ...entry,
        ast,
<<<<<<< HEAD
        fullPath: typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath)
=======
        fullPath: entry.fullPath ?? path.resolve(baseDir, entry.relPath)
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
      };
    })
  );
}

export async function iniciarInquisicao(
  baseDir: string = process.cwd(),
  options: InquisicaoOptions = {}
): Promise<ResultadoInquisicaoCompleto> {
  const { includeContent = true, incluirMetadados = true } = options;
  log.info(`🔍 Iniciando a Inquisição do Oráculo em: ${baseDir}`);


  const fileMap = await scanRepository(baseDir, { includeContent });
  let fileEntries: FileEntryWithAst[];

  if (incluirMetadados) {
    fileEntries = await prepararComAst(Object.values(fileMap), baseDir);
  } else {
    fileEntries = Object.values(fileMap).map((entry) => ({
      ...entry,
      ast: undefined,
<<<<<<< HEAD
      fullPath: typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath)
=======
      fullPath: entry.fullPath ?? path.resolve(baseDir, entry.relPath)
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd
    }));
  }

  // Agora fileEntries é FileEntryWithAst[]
  const { totalArquivos, ocorrencias } = await executarExecucao(
    fileEntries,
    tecnicas,
    baseDir,
    undefined
  );

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