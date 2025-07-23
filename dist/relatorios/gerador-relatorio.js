import fs from 'node:fs/promises';
/**
 * Gera um relatório Markdown a partir do resultado da execução.
 */
export async function gerarRelatorioMarkdown(resultado, outputPath) {
    const { totalArquivos, ocorrencias, guardian, timestamp, duracaoMs } = resultado;
    const dataISO = new Date(timestamp).toISOString();
    // Ordena ocorrências por arquivo e linha
    const ocorrenciasOrdenadas = [...ocorrencias].sort((a, b) => a.relPath.localeCompare(b.relPath) || a.linha - b.linha);
    // Cabeçalho do relatório
    const header = `# 📜 Relatório Oráculo  
**Data:** ${dataISO}  
**Duração:** ${duracaoMs.toFixed(1)}ms  
**Arquivos escaneados:** ${totalArquivos}  
**Ocorrências encontradas:** ${ocorrencias.length}  

---

## 🛡️ Verificação de Integridade (Guardian)

- **Status:** ${guardian ? guardian.status : 'não executada'}  
- **Timestamp:** ${guardian ? guardian.timestamp : '—'}  
- **Total de arquivos protegidos:** ${guardian?.totalArquivos ?? '—'}  

---

## 🚨 Ocorrências Detalhadas

| Arquivo | Linha | Nível  | Mensagem |
| ------- | ----- | ------ | -------- |
${ocorrenciasOrdenadas
        .map((o) => `| ${o.relPath} | ${o.linha} | ${o.nivel} | ${o.mensagem.replace(/\|/g, '\\|')} |`)
        .join('\n')}
`;
    // Escreve no disco
    await fs.writeFile(outputPath, header, 'utf-8');
}
/**
 * Gera um relatório JSON a partir do resultado da execução.
 */
export async function gerarRelatorioJson(resultado, outputPath) {
    const json = JSON.stringify(resultado, null, 2);
    await fs.writeFile(outputPath, json, 'utf-8');
}
