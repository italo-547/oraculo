// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { registroAnalistas, listarAnalistas } from '../analistas/registry.js';
import { log } from '../nucleo/constelacao/log.js';
import { salvarEstado } from '../zeladores/util/persistencia.js';
import path from 'node:path';
import { config } from '../nucleo/constelacao/cosmos.js';
export function comandoAnalistas() {
    return new Command('analistas')
        .description('Lista analistas registrados e seus metadados atuais')
        .option('-j, --json', 'Saída em JSON')
        .option('-o, --output <arquivo>', 'Arquivo para exportar JSON de analistas')
        .option('-d, --doc <arquivo>', 'Gera documentação Markdown dos analistas')
        .action(async (opts) => {
        const lista = listarAnalistas();
        // Geração de documentação markdown
        if (opts.doc) {
            const destinoDoc = path.isAbsolute(opts.doc)
                ? opts.doc
                : path.join(process.cwd(), opts.doc);
            const linhas = [];
            linhas.push('# Analistas Registrados');
            linhas.push('');
            linhas.push(`Gerado em: ${new Date().toISOString()}`);
            linhas.push('');
            linhas.push('| Nome | Categoria | Descrição | Limites |');
            linhas.push('| ---- | --------- | --------- | ------- |');
            for (const a of lista) {
                const registroOriginal = registroAnalistas.find((r) => r.nome === a.nome);
                let limitesStr = '';
                if (registroOriginal?.limites) {
                    limitesStr = Object.entries(registroOriginal.limites)
                        .map(([k, v]) => `${k}:${v}`)
                        .join('<br>');
                }
                linhas.push(`| ${a.nome} | ${a.categoria} | ${a.descricao || ''} | ${limitesStr} |`);
            }
            linhas.push('');
            await salvarEstado(destinoDoc, linhas.join('\n'));
            log.sucesso(`📝 Documentação de analistas gerada em ${destinoDoc}`);
            return;
        }
        if (opts.output) {
            const destino = path.isAbsolute(opts.output)
                ? opts.output
                : path.join(process.cwd(), opts.output);
            await salvarEstado(destino, {
                geradoEm: new Date().toISOString(),
                total: lista.length,
                analistas: lista,
                configLimites: config.ANALISE_LIMITES ?? {},
            });
            log.sucesso(`📄 Exportado JSON de analistas para ${destino}`);
            return;
        }
        if (opts.json) {
            log.info(JSON.stringify({ total: lista.length, analistas: lista }, null, 2));
            return;
        }
        log.info('\n📋 Analistas registrados:\n');
        for (const a of lista) {
            log.info(`- ${a.nome} (${a.categoria}) ${a.descricao ? '— ' + a.descricao : ''}`);
        }
        log.info(`\nTotal: ${registroAnalistas.length}`);
    });
}
//# sourceMappingURL=comando-analistas.js.map