import fs from 'node:fs/promises';
import { ResultadoInquisicaoCompleto, Ocorrencia } from '../tipos/tipos.js';

/**
 * Gera um relatório Markdown a partir do resultado da execução.
 */
export async function gerarRelatorioMarkdown(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string
): Promise<void> {
  const { totalArquivos, ocorrencias, guardian, timestamp, duracaoMs } = resultado;
  const dataISO = new Date(timestamp).toISOString();
  const ocorrenciasOrdenadas: Ocorrencia[] = [...ocorrencias].sort(
    (a, b) => a.relPath?.localeCompare(b.relPath ?? '') || (a.linha ?? 0) - (b.linha ?? 0)
  );

  const header = `# 📜 Relatório Oráculo  

**Data:** ${dataISO}  
**Duração:** ${duracaoMs.toFixed(1)}ms  
**Arquivos escaneados:** ${totalArquivos}  
**Ocorrências encontradas:** ${ocorrencias.length}  

---

## 🛡️ Verificação de Integridade (Guardian)

  - **Status:** ${(guardian && typeof guardian === 'object' && 'status' in guardian) ? (guardian as any).status : 'não executada'}
  - **Timestamp:** ${(guardian && typeof guardian === 'object' && 'timestamp' in guardian) ? (guardian as any).timestamp : '—'}
  - **Total de arquivos protegidos:** ${(guardian && typeof guardian === 'object' && 'totalArquivos' in guardian) ? (guardian as any).totalArquivos : '—'}

---

## 🚨 Ocorrências Detalhadas

| Arquivo | Linha | Nível  | Mensagem |
| ------- | ----- | ------ | -------- |
${ocorrenciasOrdenadas
      .map(
        (o) =>
          `| ${o.relPath} | ${o.linha ?? ''} | ${o.nivel ?? ''} | ${o.mensagem.replace(/\|/g, '\\|')} |`
      )
      .join('\\n')}
`;

  await fs.writeFile(outputPath, header, 'utf-8');
}

/**
 * Gera um relatório JSON a partir do resultado da execução.
 */
export async function gerarRelatorioJson(
  resultado: ResultadoInquisicaoCompleto,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(resultado, null, 2);
  await fs.writeFile(outputPath, json, 'utf-8');
}