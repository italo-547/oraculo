import { ritualComando } from '../analistas/ritual-comando.js';
import * as path from 'path';
import { scanRepository } from './scanner.js';
import { decifrarSintaxe } from './parser.js';
import { executarInquisicao as executarExecucao } from './executor.js';
import { detectorEstrutura } from '../analistas/detector-estrutura.js';
import { detectorDependencias } from '../analistas/detector-dependencias.js';
import { analistaFuncoesLongas } from '../analistas/analista-funcoes-longas.js';
import { analistaPadroesUso } from '../analistas/analista-padroes-uso.js';
import { log } from './constelacao/log.js';
import { config } from './constelacao/cosmos.js';

import type {
  FileEntryWithAst,
  FileEntry,
  InquisicaoOptions,
  Tecnica,
  ResultadoInquisicaoCompleto,
} from '../tipos/tipos.js';

const EXTENSOES_COM_AST = new Set(
  Array.isArray(config.SCANNER_EXTENSOES_COM_AST)
    ? config.SCANNER_EXTENSOES_COM_AST
    : ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
);

export const tecnicas: Tecnica[] = [
  detectorDependencias,
  detectorEstrutura,
  analistaFuncoesLongas,
  analistaPadroesUso,
  ritualComando,
];

export async function prepararComAst(
  entries: FileEntry[],
  baseDir: string,
): Promise<FileEntryWithAst[]> {
  return Promise.all(
    entries.map(async (entry): Promise<FileEntryWithAst> => {
      let ast: import('@babel/traverse').NodePath<import('@babel/types').Node> | undefined =
        undefined;
      const ext = path.extname(entry.relPath);

      if (entry.content && EXTENSOES_COM_AST.has(ext)) {
        try {
          const parsed = await decifrarSintaxe(entry.content, ext);
          if (parsed && typeof parsed === 'object' && 'node' in parsed && 'parent' in parsed) {
            ast = parsed as unknown as import('@babel/traverse').NodePath<
              import('@babel/types').Node
            >;
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
        fullPath:
          typeof entry.fullPath === 'string'
            ? entry.fullPath
            : path.resolve(baseDir, entry.relPath),
      };
    }),
  );
}

export async function iniciarInquisicao(
  baseDir: string = process.cwd(),
  options: InquisicaoOptions = {},
): Promise<ResultadoInquisicaoCompleto> {
  const { includeContent = true, incluirMetadados = true } = options;
  log.info(`🔍 Iniciando a Inquisição do Oráculo em: ${baseDir}`);

  const fileMap = await scanRepository(baseDir, {
    includeContent,
    onProgress: (msg) => {
      // Só exibe diretórios e erros, e em formato legível por máquina/pessoa
      try {
        const obj = JSON.parse(msg);
        if (obj.tipo === 'diretorio') {
          log.info(`Examinando diretório: ${obj.caminho}`);
        } else if (obj.tipo === 'erro') {
          log.erro(`Erro ao ${obj.acao} ${obj.caminho}: ${obj.mensagem}`);
        }
      } catch {
        // fallback para logs antigos
        if (msg && msg.includes('⚠️')) log.aviso(msg);
      }
    },
  });
  let fileEntries: FileEntryWithAst[];

  if (incluirMetadados) {
    fileEntries = await prepararComAst(Object.values(fileMap), baseDir);
  } else {
    fileEntries = Object.values(fileMap).map((entry) => ({
      ...entry,
      ast: undefined,
      fullPath:
        typeof entry.fullPath === 'string' ? entry.fullPath : path.resolve(baseDir, entry.relPath),
    }));
  }

  // Agora fileEntries é FileEntryWithAst[]
  const { totalArquivos, ocorrencias } = await executarExecucao(
    fileEntries,
    tecnicas,
    baseDir,
    undefined,
  );

  log.sucesso(`🔮 Inquisição concluída. Total de ocorrências: ${ocorrencias.length}`);

  return {
    totalArquivos,
    ocorrencias,
    arquivosAnalisados: fileEntries.map((f) => f.relPath),
    timestamp: Date.now(),
    duracaoMs: 0,
    fileEntries,
    guardian: undefined,
  };
}

export { executarExecucao as executarInquisicao };
