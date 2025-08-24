// SPDX-License-Identifier: MIT
// Import dinâmico para facilitar intercepção por vi.mock em diferentes variações de caminho nos testes
import { formatMs } from '../nucleo/constelacao/format.js';
import { ResultadoInquisicaoCompleto, Ocorrencia } from '../tipos/tipos.js';

export async function gerarRelatorioMarkdown(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string,
): Promise<void> {
  const {
    totalArquivos = 0,
    ocorrencias = [],
    guardian,
    timestamp = Date.now(),
    duracaoMs = 0,
  } = (resultado || {}) as ResultadoInquisicaoCompleto;
  const dataISO = new Date(timestamp).toISOString();
  const ocorrenciasOrdenadas: Ocorrencia[] = [...ocorrencias].sort((a, b) => {
    const ra = String(a.relPath ?? '');
    const rb = String(b.relPath ?? '');
    const cmp = ra.localeCompare(rb);
    if (cmp !== 0) return cmp;
    const la = typeof a.linha === 'number' ? a.linha : Number.MAX_SAFE_INTEGER;
    const lb = typeof b.linha === 'number' ? b.linha : Number.MAX_SAFE_INTEGER;
    return la - lb;
  });

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
      `| ${o.relPath} | ${o.linha ?? ''} | ${o.nivel ?? ''} | ${String(o.mensagem || '').replace(/\|/g, '\\|')} |`,
  )
  .join('\n')}
`;

  const { salvarEstado } = await import('../zeladores/util/persistencia.js');
  await salvarEstado(outputPath, header);
}

export async function gerarRelatorioJson(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string,
): Promise<void> {
  // Persistir exatamente o objeto fornecido (tests verificam identidade)
  const { salvarEstado } = await import('../zeladores/util/persistencia.js');
  await salvarEstado(outputPath, resultado);
}
