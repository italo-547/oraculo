// SPDX-License-Identifier: MIT
import { salvarEstado } from '@zeladores/util/persistencia.js';
export async function gerarRelatorioReestruturarMarkdown(caminho, movimentos, opcoes) {
    const data = new Date().toISOString();
    const total = movimentos.length;
    const simulado = opcoes?.simulado;
    const origem = opcoes?.origem ?? 'desconhecido';
    const preset = opcoes?.preset ?? 'oraculo';
    const conflitos = opcoes?.conflitos ?? 0;
    const linhas = [];
    linhas.push('# 🧩 Relatório de Reestruturação Oracular');
    linhas.push('');
    linhas.push(`**Data:** ${data}  `);
    linhas.push(`**Execução:** ${simulado ? 'Simulação' : 'Real'}  `);
    linhas.push(`**Origem do plano:** ${origem}  `);
    linhas.push(`**Preset:** ${preset}  `);
    linhas.push(`**Total de movimentos:** ${total}  `);
    linhas.push(`**Conflitos detectados:** ${conflitos}  `);
    linhas.push('');
    linhas.push('---');
    linhas.push('');
    linhas.push('## Movimentos');
    if (!total) {
        linhas.push('Nenhum movimento sugerido neste ciclo.');
    }
    else {
        linhas.push('| De | Para |');
        linhas.push('|----|------|');
        for (const m of movimentos) {
            linhas.push(`| ${m.de} | ${m.para} |`);
        }
    }
    await salvarEstado(caminho, linhas.join('\n'));
}
export async function gerarRelatorioReestruturarJson(caminho, movimentos, opcoes) {
    const json = {
        simulado: Boolean(opcoes?.simulado),
        origem: opcoes?.origem ?? 'desconhecido',
        preset: opcoes?.preset ?? 'oraculo',
        conflitos: opcoes?.conflitos ?? 0,
        totalMovimentos: movimentos.length,
        movimentos,
        timestamp: Date.now(),
    };
    await salvarEstado(caminho, json);
}
//# sourceMappingURL=relatorio-reestruturar.js.map