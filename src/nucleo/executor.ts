import { log } from './constelacao/log.js';
import type {
  FileEntryWithAst,
  Ocorrencia,
  Tecnica,
  ContextoExecucao,
  ResultadoInquisicao,
} from '../tipos/tipos.js';

export async function executarInquisicao(
  fileEntriesComAst: FileEntryWithAst[],
  tecnicas: Tecnica[],
  baseDir: string,
  guardianResultado: unknown,
  opts?: { verbose?: boolean }
): Promise<ResultadoInquisicao> {
  // log.info('🧪 Iniciando execução das técnicas...\n'); // Silenciado para saída limpa

  const arquivosValidosSet = new Set(fileEntriesComAst.map((f) => f.relPath));
  const contextoGlobal: ContextoExecucao = {
    baseDir,
    arquivos: fileEntriesComAst,
    ambiente: {
      arquivosValidosSet,
      guardian: guardianResultado,
    },
  };

  const ocorrencias: Ocorrencia[] = [];
  const inicioExecucao = performance.now();

  // � Técnicas globais
  for (const tecnica of tecnicas) {
    if (tecnica.global) {
      const inicio = performance.now();
      try {
        const resultado = await tecnica.aplicar('', '', null, undefined, contextoGlobal);
        if (resultado) {
          ocorrencias.push(...(Array.isArray(resultado) ? resultado : [resultado]));
        }
        const duracao = (performance.now() - inicio).toFixed(1);
        if (opts?.verbose) {
          log.sucesso(`✅ Técnica global '${tecnica.nome}' executada em ${duracao}ms`);
        }
      } catch (error) {
        const err = error as Error;
        log.erro(`❌ Erro na técnica global '${tecnica.nome}': ${err.message}`);
        if (err.stack && opts?.verbose) log.info(err.stack);
        ocorrencias.push({
          tipo: 'erro',
          nivel: 'aviso',
          mensagem: `Falha na técnica global '${tecnica.nome}': ${err.message}`,
          relPath: '[execução global]',
          arquivo: '[execução global]',
          linha: 0,
        });
      }
    }
  }

  // � Técnicas por arquivo
  let arquivoAtual = 0;
  const totalArquivos = fileEntriesComAst.length;
  for (const entry of fileEntriesComAst) {
    arquivoAtual++;
    if (opts?.verbose) {
      log.info(`🔎 Arquivo ${arquivoAtual}/${totalArquivos}: ${entry.relPath}`);
    } else if (arquivoAtual % 10 === 0 || arquivoAtual === totalArquivos) {
      log.info(`Arquivos analisados: ${arquivoAtual}/${totalArquivos}`);
    }
    for (const tecnica of tecnicas) {
      if (tecnica.global) continue;
      if (tecnica.test && !tecnica.test(entry.relPath)) continue;

      const inicio = performance.now();
      try {
        const resultado = await tecnica.aplicar(
          entry.content ?? '',
          entry.relPath,
          entry.ast ?? null,
          entry.fullPath,
          contextoGlobal,
        );
        if (resultado) {
          ocorrencias.push(...(Array.isArray(resultado) ? resultado : [resultado]));
        }
        const duracao = (performance.now() - inicio).toFixed(1);
        if (opts?.verbose) {
          log.info(`📄 '${tecnica.nome}' analisou ${entry.relPath} em ${duracao}ms`);
        }
      } catch (error) {
        const err = error as Error;
        log.erro(`❌ Erro em '${tecnica.nome}' para ${entry.relPath}: ${err.message}`);
        if (err.stack && opts?.verbose) log.info(err.stack);
        ocorrencias.push({
          tipo: 'erro',
          nivel: 'erro',
          mensagem: `Falha na técnica '${tecnica.nome}' para ${entry.relPath}: ${err.message}`,
          relPath: entry.relPath,
          arquivo: entry.relPath,
          linha: 0,
        });
      }
    }
  }

  const fimExecucao = performance.now();
  const duracaoMs = Math.round(fimExecucao - inicioExecucao);

  return {
    totalArquivos: fileEntriesComAst.length,
    arquivosAnalisados: fileEntriesComAst.map((e) => e.relPath),
    ocorrencias,
    timestamp: Date.now(),
    duracaoMs,
  };
}
