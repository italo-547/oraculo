import { salvarEstado } from '../zeladores/util/persistencia.js';
import type { Pendencia } from '../tipos/tipos.js';

export async function gerarRelatorioPodaMarkdown(
  caminho: string,
  podados: Pendencia[],
  mantidos: Pendencia[],
  opcoes?: { simulado?: boolean },
): Promise<void> {
  const data = new Date().toISOString();
  const totalPodados = podados.length;
  const totalMantidos = mantidos.length;
  const simulado = opcoes?.simulado;

  let md = `# 🌿 Relatório de Poda Oracular\n\n`;
  md += `**Data:** ${data}  \n`;
  md += `**Execução:** ${simulado ? 'Simulação' : 'Real'}  \n`;
  md += `**Arquivos podados:** ${totalPodados}  \n`;
  md += `**Arquivos mantidos:** ${totalMantidos}  \n`;
  md += `\n---\n`;

  md += `## Arquivos Podados\n`;
  if (totalPodados === 0) {
    md += 'Nenhum arquivo foi podado neste ciclo.\n';
  } else {
    md += '| Arquivo | Motivo | Dias Inativo | Detectado em |\n';
    md += '|---------|--------|--------------|--------------|\n';
    for (const p of podados) {
      const pendenciaObj = p as unknown as Record<string, unknown>;
      const diasInativo =
        typeof pendenciaObj.diasInativo === 'number' ? String(pendenciaObj.diasInativo) : '-';
      md += `| ${p.arquivo} | ${p.motivo} | ${diasInativo} | ${p.detectedAt ? new Date(p.detectedAt).toISOString().slice(0, 10) : '-'} |\n`;
    }
  }
  md += '\n---\n';

  md += `## Arquivos Mantidos\n`;
  if (totalMantidos === 0) {
    md += 'Nenhum arquivo mantido neste ciclo.\n';
  } else {
    md += '| Arquivo | Motivo |\n';
    md += '|---------|--------|\n';
    for (const p of mantidos) {
      md += `| ${p.arquivo} | ${p.motivo} |\n`;
    }
  }

  await salvarEstado(caminho, md);
}

export async function gerarRelatorioPodaJson(
  caminho: string,
  podados: Pendencia[],
  mantidos: Pendencia[],
): Promise<void> {
  const json = {
    podados: podados.map((p) => {
      const pendenciaObj = p as unknown as Record<string, unknown>;
      return {
        arquivo: p.arquivo,
        motivo: p.motivo,
        diasInativo:
          typeof pendenciaObj.diasInativo === 'number' ? pendenciaObj.diasInativo : undefined,
      };
    }),
    mantidos: mantidos.map((p) => ({ arquivo: p.arquivo, motivo: p.motivo })),
    totalPodados: podados.length,
    totalMantidos: mantidos.length,
    timestamp: Date.now(),
  };
  await salvarEstado(caminho, json);
}
