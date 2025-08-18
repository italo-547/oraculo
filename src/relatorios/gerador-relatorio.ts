// SPDX-License-Identifier: MIT
import { salvarEstado } from '../zeladores/util/persistencia.js';
import { formatMs } from '../nucleo/constelacao/format.js';
import { ResultadoInquisicaoCompleto, Ocorrencia } from '../tipos/tipos.js';

export async function gerarRelatorioMarkdown(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string,
): Promise<void> {
  const { totalArquivos, ocorrencias, guardian, timestamp, duracaoMs } = resultado;
  const dataISO = new Date(timestamp).toISOString();
  const ocorrenciasOrdenadas: Ocorrencia[] = [...ocorrencias].sort(
    (a, b) => (a.relPath?.localeCompare(b.relPath ?? '') ?? 0) || (a.linha ?? 0) - (b.linha ?? 0),
  );

  const guardianStatus =
    guardian && typeof guardian === 'object' && 'status' in guardian
      ? String((guardian as Record<string, unknown>).status)
      : 'não executada';
  const guardianTimestamp =
    guardian && typeof guardian === 'object' && 'timestamp' in guardian
      ? String((guardian as Record<string, unknown>).timestamp)
      : '—';
  const guardianTotalArquivos =
    guardian && typeof guardian === 'object' && 'totalArquivos' in guardian
      ? String((guardian as Record<string, unknown>).totalArquivos)
      : '—';

  const header = `# 🧾 Relatório Oráculo  

**Data:** ${dataISO}  
**Duração:** ${formatMs(duracaoMs)}  
**Arquivos escaneados:** ${totalArquivos}  
**Ocorrências encontradas:** ${ocorrencias.length}  

---

## 🛡️ Verificação de Integridade (Guardian)

  - **Status:** ${guardianStatus}
  - **Timestamp:** ${guardianTimestamp}
  - **Total de arquivos protegidos:** ${guardianTotalArquivos}

---

## 🚨 Ocorrências Detalhadas

| Arquivo | Linha | Nível  | Mensagem |
| ------- | ----- | ------ | -------- |
${ocorrenciasOrdenadas
  .map(
    (o) =>
      `| ${o.relPath} | ${o.linha ?? ''} | ${o.nivel ?? ''} | ${o.mensagem.replace(/\|/g, '\\|')} |`,
  )
  .join('\n')}
`;

  await salvarEstado(outputPath, header);
}

export async function gerarRelatorioJson(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string,
): Promise<void> {
  await salvarEstado(outputPath, resultado);
}
