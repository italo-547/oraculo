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

  // 🔵 Técnicas globais
  for (const tecnica of tecnicas) {
    if (tecnica.global) {
      const inicio = performance.now();
      try {
        const resultado = await tecnica.aplicar('', '', null, undefined, contextoGlobal);
        if (resultado) {
          ocorrencias.push(...(Array.isArray(resultado) ? resultado : [resultado]));
        }
        const duracao = (performance.now() - inicio).toFixed(1);
        // log.sucesso(`✅ Técnica global '${tecnica.nome}' executada em ${duracao}ms`); // Silenciado para saída limpa
      } catch (error) {
        const err = error as Error;
        log.erro(`❌ Erro na técnica global '${tecnica.nome}': ${err.message}`);
        if (err.stack) log.info(err.stack);
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

  // 🟢 Técnicas por arquivo
  for (const entry of fileEntriesComAst) {
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
        // log.info(`📄 '${tecnica.nome}' analisou ${entry.relPath} em ${duracao}ms`); // Silenciado para saída limpa
      } catch (error) {
        const err = error as Error;
        log.erro(`❌ Erro em '${tecnica.nome}' para ${entry.relPath}: ${err.message}`);
        if (err.stack) log.info(err.stack);
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
