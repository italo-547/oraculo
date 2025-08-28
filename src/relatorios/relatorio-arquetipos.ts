// SPDX-License-Identifier: MIT
import type { ResultadoDeteccaoArquetipo } from '../tipos/tipos.js';
import { salvarEstado } from '../zeladores/util/persistencia.js';
import path from 'node:path';

export async function exportarRelatorioArquetiposMarkdown(
  destino: string,
  candidatos: ResultadoDeteccaoArquetipo[],
  contexto?: { origem?: string },
  detalhado = false,
) {
  const linhas: string[] = [];
  linhas.push(`# Relatório de Detecção de Arquétipos`);
  if (contexto?.origem) linhas.push(`*Origem: ${contexto.origem}*`);
  linhas.push('');
  linhas.push('| Arquétipo | Confiança (%) | Score | Explicação | Sugestão |');
  linhas.push('|-----------|---------------|-------|------------|----------|');
  for (const c of candidatos) {
    if (!detalhado) {
      // Relatório compacto
      const missing = c.missingRequired?.slice(0, 3) || [];
      const forbidden = c.forbiddenPresent?.slice(0, 3) || [];
      const dependFalt =
        c.dependencyMatches?.length === 0 && c.dependencyMatches !== undefined
          ? c.dependencyMatches
          : [];
      let resumo = '';
      if (missing.length) resumo += `Faltam pastas: ${missing.join(', ')}. `;
      if (forbidden.length) resumo += `Estruturas proibidas: ${forbidden.join(', ')}. `;
      if (dependFalt.length) resumo += `Dependências ausentes: ${dependFalt.join(', ')}. `;
      if (c.sugestaoPadronizacao) resumo += c.sugestaoPadronizacao.replace(/\n/g, ' ');
      if (!resumo) resumo = 'Estrutura próxima do ideal.';
      // Compacta explicação
      const explicacao = (c.explicacaoSimilaridade || '').split('\n').slice(0, 2).join(' ');
      linhas.push(`| ${c.nome} | ${c.confidence} | ${c.score} | ${explicacao} | ${resumo} |`);
    } else {
      // Relatório detalhado enriquecido
      linhas.push(`\n## ${c.nome}`);
      linhas.push(`Confiança: ${c.confidence} | Score: ${c.score}`);
      linhas.push(`Explicação: ${c.explicacaoSimilaridade?.replace(/\n/g, ' ')}`);
      linhas.push(`Sugestão: ${c.sugestaoPadronizacao?.replace(/\n/g, ' ')}`);
      // Gravidade dos problemas
      if (c.missingRequired?.length)
        linhas.push(
          `Pastas faltantes (gravidade: crítico): ${c.missingRequired.map((p) => `${p} [mkdir ${p}]`).join(', ')}`,
        );
      if (c.forbiddenPresent?.length)
        linhas.push(`Estruturas proibidas (gravidade: risco): ${c.forbiddenPresent.join(', ')}`);
      if (c.dependencyMatches?.length)
        linhas.push(`Dependências detectadas: ${c.dependencyMatches.join(', ')}`);
      if (c.filePatternMatches?.length)
        linhas.push(`Padrões de arquivos: ${c.filePatternMatches.join(', ')}`);
      if (c.anomalias?.length)
        linhas.push(
          `Anomalias: ${c.anomalias.map((a) => a.path + ' (' + a.motivo + ')').join(', ')}`,
        );
      // Sugestões automáticas de comandos/scripts
      if (c.missingRequired?.length) {
        linhas.push(`Sugestão de comandos:`);
        c.missingRequired.forEach((p) => linhas.push(`  mkdir ${p}`));
      }
      // Dependências ausentes (simples)
      if (c.dependencyMatches && Array.isArray(c.dependencyMatches)) {
        const ausentes =
          c.dependencyMatches.length === 0 && c.dependencyMatches !== undefined
            ? c.dependencyMatches
            : [];
        if (ausentes.length) {
          linhas.push(`Sugestão de comandos para dependências:`);
          ausentes.forEach((dep) => linhas.push(`  npm install ${dep}`));
        }
      }
      // Links para documentação oficial
      if (c.nome) {
        const docLinks: Record<string, string> = {
          'api-rest-express': 'https://expressjs.com/pt-br/',
          fullstack: 'https://nextjs.org/docs',
          monorepo: 'https://turborepo.org/docs',
          cli: 'https://nodejs.org/api/cli.html',
          lib: 'https://www.typescriptlang.org/docs/',
        };
        if (docLinks[c.nome]) linhas.push(`Documentação oficial: ${docLinks[c.nome]}`);
      }
      // Frameworks detectados
      if (c.dependencyMatches?.length) {
        const fwLinks: Record<string, string> = {
          express: 'https://expressjs.com/pt-br/',
          react: 'https://react.dev/',
          next: 'https://nextjs.org/docs',
          electron: 'https://www.electronjs.org/docs',
          'discord.js': 'https://discord.js.org/#/docs',
          telegraf: 'https://telegraf.js.org/',
        };
        c.dependencyMatches.forEach((dep) => {
          if (fwLinks[dep]) linhas.push(`Doc ${dep}: ${fwLinks[dep]}`);
        });
      }
      // Práticas inseguras e smells (exemplo)
      if (
        c.explicacaoSimilaridade &&
        /função longa|require dinâmico|import misto|eval/.test(c.explicacaoSimilaridade)
      ) {
        linhas.push(`Práticas inseguras detectadas: ${c.explicacaoSimilaridade}`);
      }
      // Dependências desatualizadas/vulneráveis (simples)
      try {
        const fs = await import('node:fs');
        const pkgPath = path.resolve(process.cwd(), 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          if (pkg.dependencies) {
            for (const dep in pkg.dependencies) {
              // Simulação: destaca dependências com versão "0." ou "^0." como desatualizadas/vulneráveis
              if (/^0\./.test(pkg.dependencies[dep]) || /^\^0\./.test(pkg.dependencies[dep])) {
                linhas.push(
                  `Dependência potencialmente desatualizada/vulnerável: ${dep} (${pkg.dependencies[dep]}) [grave]`,
                );
                linhas.push(`Sugestão: npm update ${dep}`);
              }
            }
          }
        }
      } catch {}
      // Status do npm audit
      try {
        const { execSync } = await import('node:child_process');
        const auditRaw = execSync('npm audit --json', { encoding: 'utf-8' });
        const audit = JSON.parse(auditRaw);
        if (audit.metadata?.vulnerabilities?.total > 0) {
          linhas.push(`Vulnerabilidades detectadas pelo npm audit:`);
          for (const [sev, qtd] of Object.entries(audit.metadata.vulnerabilities)) {
            if (typeof qtd === 'number' && qtd > 0 && sev !== 'total') {
              linhas.push(`  ${sev}: ${qtd}`);
            }
          }
          linhas.push('Sugestão: npm audit fix');
        } else {
          linhas.push('Nenhuma vulnerabilidade encontrada pelo npm audit.');
        }
      } catch {}
      linhas.push('---');
    }
  }
  linhas.push('');
  linhas.push('---');
  linhas.push('**Como o diagnóstico foi feito:**');
  linhas.push(
    `A pontuação de cada arquétipo considera presença de pastas obrigatórias, opcionais, padrões de arquivos, dependências e penalidades por estruturas proibidas. O campo "Explicação" detalha os fatores que levaram à sugestão.`,
  );
  await salvarEstado(destino, linhas.join('\n'));
}

export async function exportarRelatorioArquetiposJson(
  destino: string,
  candidatos: ResultadoDeteccaoArquetipo[],
  contexto?: { origem?: string },
  detalhado = false,
) {
  const relatorio = {
    origem: contexto?.origem ?? null,
    candidatos: candidatos.map((c) => {
      if (!detalhado) {
        // Compacto
        const missing = c.missingRequired?.slice(0, 3) || [];
        const forbidden = c.forbiddenPresent?.slice(0, 3) || [];
        const dependFalt =
          c.dependencyMatches?.length === 0 && c.dependencyMatches !== undefined
            ? c.dependencyMatches
            : [];
        let resumo = '';
        if (missing.length) resumo += `Faltam pastas: ${missing.join(', ')}. `;
        if (forbidden.length) resumo += `Estruturas proibidas: ${forbidden.join(', ')}. `;
        if (dependFalt.length) resumo += `Dependências ausentes: ${dependFalt.join(', ')}. `;
        if (c.sugestaoPadronizacao) resumo += c.sugestaoPadronizacao.replace(/\n/g, ' ');
        if (!resumo) resumo = 'Estrutura próxima do ideal.';
        // Compacta explicação
        const explicacao = (c.explicacaoSimilaridade || '').split('\n').slice(0, 2).join(' ');
        return {
          nome: c.nome,
          confidence: c.confidence,
          score: c.score,
          explicacao,
          resumo,
          matchedRequired: c.matchedRequired?.slice(0, 3) || [],
          missingRequired: missing,
          forbiddenPresent: forbidden,
          descricao: c.descricao,
        };
      } else {
        // Detalhado
        return {
          nome: c.nome,
          confidence: c.confidence,
          score: c.score,
          explicacao: c.explicacaoSimilaridade,
          sugestao: c.sugestaoPadronizacao,
          matchedRequired: c.matchedRequired,
          missingRequired: c.missingRequired,
          matchedOptional: c.matchedOptional,
          dependencyMatches: c.dependencyMatches,
          filePatternMatches: c.filePatternMatches,
          forbiddenPresent: c.forbiddenPresent,
          anomalias: c.anomalias,
          descricao: c.descricao,
        };
      }
    }),
  };
  await salvarEstado(destino, relatorio);
}
