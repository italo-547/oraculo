/**
 * Executor de worker para processamento paralelo de arquivos
 * Este arquivo é executado em threads separadas pelos Worker Threads
 */

const { parentPort, workerData } = require('worker_threads');
const { promises: fs } = require('fs');
const path = require('path');

// Importar tipos necessários (simplificados para worker)
const tipos = {
  Ocorrencia: class {
    constructor(arquivo, linha, coluna, tipo, mensagem, severidade, tecnica, contexto) {
      this.arquivo = arquivo;
      this.linha = linha;
      this.coluna = coluna;
      this.tipo = tipo;
      this.mensagem = mensagem;
      this.severidade = severidade;
      this.tecnica = tecnica;
      this.contexto = contexto;
    }
  },
};

// Função para executar uma técnica em um arquivo
async function executarTecnicaEmArquivo(tecnica, arquivo, contexto, timeoutMs) {
  // Se a técnica fornecer um executor assíncrono real, deverá ser chamado aqui.
  // Por enquanto, mantemos o comportamento resiliente: se não há implementação, retorna [] rapidamente.
  if (typeof tecnica?.aplicar !== 'function') return [];

  const execPromise = tecnica.aplicar(
    arquivo.content ?? '',
    arquivo.relPath,
    arquivo.ast ?? null,
    arquivo.fullPath,
    contexto,
  );

  if (timeoutMs && timeoutMs > 0) {
    // Race entre execução e timeout por analista
    return Promise.race([
      execPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout: tecnica '${tecnica.nome}' excedeu ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]).catch((err) => {
      // Normaliza erro como ocorrência para retorno padronizado
      return [
        {
          arquivo: arquivo.relPath,
          linha: 1,
          coluna: 1,
          tipo: 'ERRO_EXECUCAO',
          mensagem: `Erro ao executar técnica ${tecnica.nome}: ${err.message}`,
          severidade: 'erro',
          tecnica: tecnica.nome,
          contexto: { erro: err.message, stack: err.stack },
        },
      ];
    });
  }

  try {
    return await execPromise;
  } catch (erro) {
    return [
      {
        arquivo: arquivo.relPath,
        linha: 1,
        coluna: 1,
        tipo: 'ERRO_EXECUCAO',
        mensagem: `Erro ao executar técnica ${tecnica.nome}: ${erro.message}`,
        severidade: 'erro',
        tecnica: tecnica.nome,
        contexto: { erro: erro.message, stack: erro.stack },
      },
    ];
  }
}

// Pequeno yield para liberar o loop de eventos (evita bloqueios longos em workers)
function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

// Processar lote de arquivos
async function processarLote(lote, contexto) {
  const resultados = [];
  const timeoutMs = Number(workerData?.timeoutMs) || 0;

  // O lote pode conter elementos no formato atual (files array + techniques), ou tarefas individuais.
  // Suportamos ambos: se o primeiro item tiver "tecnica" assumimos formato de tarefa antiga.
  if (Array.isArray(lote) && lote.length > 0 && lote[0] && lote[0].tecnica) {
    // Formato legado: [{ tecnica, arquivo }, ...]
    for (const tarefa of lote) {
      const { tecnica, arquivo } = tarefa;
      try {
        const ocorrencias = await executarTecnicaEmArquivo(tecnica, arquivo, contexto, timeoutMs);
        resultados.push({
          sucesso: true,
          arquivo: arquivo.relPath ?? arquivo,
          tecnica: tecnica.nome,
          ocorrencias,
          tempoProcessamento: Date.now(),
        });
      } catch (erro) {
        resultados.push({
          sucesso: false,
          arquivo: arquivo.relPath ?? arquivo,
          tecnica: tecnica.nome,
          erro: erro.message,
          tempoProcessamento: Date.now(),
        });
      }
      // Yield ocasional para evitar bloqueio prolongado do event loop
      await yieldEventLoop();
    }
    return resultados;
  }

  // Novo formato: lote é uma lista de arquivos; aplicamos cada técnica do conjunto passado via workerData.techniques
  const techniques = Array.isArray(workerData?.techniques) ? workerData.techniques : [];
  const files = Array.isArray(workerData?.files) ? workerData.files : [];

  for (const file of files) {
    const fileResult = { arquivo: file.relPath, ocorrencias: [], tempos: [], erros: [] };
    for (const tecnica of techniques) {
      if (tecnica.test && !tecnica.test(file.relPath)) continue;
      try {
        const inicio = Date.now();
        const out = await executarTecnicaEmArquivo(tecnica, file, contexto, timeoutMs);
        const dur = Date.now() - inicio;
        if (out && Array.isArray(out)) fileResult.ocorrencias.push(...out);
        fileResult.tempos.push({ tecnica: tecnica.nome, duracaoMs: dur });
      } catch (err) {
        fileResult.erros.push(String(err && err.message ? err.message : err));
      }
      // Pequeno yield entre técnicas para permitir processamento de mensagens/eventos
      await yieldEventLoop();
    }
    resultados.push({
      sucesso: true,
      arquivo: file.relPath,
      ocorrencias: fileResult.ocorrencias,
      tempoProcessamento: Date.now(),
      erros: fileResult.erros,
      tempos: fileResult.tempos,
    });
    // Yield entre arquivos para reduzir pressão no loop de eventos em workloads longos
    await yieldEventLoop();
  }

  return resultados;
}

// Handler principal do worker
async function main() {
  // Heartbeat period (worker sinaliza ao pai que ainda está vivo)
  const HEARTBEAT_MS = 5000;
  let heartbeatInterval = null;
  try {
    const { contexto } = workerData;
    try {
      if (typeof parentPort?.postMessage === 'function') {
        heartbeatInterval = setInterval(() => {
          try {
            parentPort.postMessage({ type: 'heartbeat', ts: Date.now(), workerId: process.pid });
          } catch (e) {
            // ignore
          }
        }, HEARTBEAT_MS);
      }
    } catch (e) {
      /* ignore */
    }
    // Processar o lote (a função resolve formatos antigos e novos)
    const resultados = await processarLote(workerData.lote ?? workerData.files ?? [], contexto);

    // Normaliza agregados para formato esperado pelo WorkerPool
    const occurrences = resultados.flatMap((r) => r.ocorrencias || []);
    const metrics = resultados.flatMap((r) => r.tempos || []);
    const processedFiles = Array.isArray(workerData.files)
      ? workerData.files.length
      : resultados.length || 0;

    parentPort.postMessage({
      sucesso: true,
      resultados,
      workerId: process.pid,
      occurrences,
      metrics,
      processedFiles,
      duration: Date.now(),
    });
  } catch (erro) {
    // Enviar erro de volta
    try {
      parentPort.postMessage({
        sucesso: false,
        erro: erro.message,
        stack: erro.stack,
        workerId: process.pid,
      });
    } catch (_) {
      // ignore
    }
  } finally {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  }
}

// Executar quando o worker for iniciado
main().catch((erro) => {
  parentPort.postMessage({
    sucesso: false,
    erro: erro.message,
    stack: erro.stack,
    workerId: process.pid,
  });
});
