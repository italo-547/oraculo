// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import chalk from '../nucleo/constelacao/chalk-safe.js';
import { executarShellSeguro } from '../nucleo/util/exec-safe.js';
import { iniciarInquisicao } from '../nucleo/inquisidor.js';
import { scanSystemIntegrity } from '../guardian/sentinela.js';
import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';
export function comandoAtualizar(aplicarFlagsGlobais) {
    return new Command('atualizar')
        .description('Atualiza o Oráculo se a integridade estiver preservada')
        .option('--global', 'atualiza globalmente via npm i -g')
        .action(async function (opts) {
        aplicarFlagsGlobais(this.parent && typeof this.parent.opts === 'function' ? this.parent.opts() : {});
        log.info(chalk.bold('\n🔄 Iniciando processo de atualização...\n'));
        const baseDir = process.cwd();
        let fileEntries = [];
        try {
            const resultado = await iniciarInquisicao(baseDir, { incluirMetadados: false });
            fileEntries = resultado.fileEntries;
            const guardianResultado = await scanSystemIntegrity(fileEntries);
            if (guardianResultado.status === 'ok' ||
                guardianResultado.status === 'baseline-aceito') {
                log.sucesso('🔒 Guardian: integridade validada. Prosseguindo atualização.');
            }
            else {
                log.aviso('🌀 Guardian gerou novo baseline ou detectou alterações. Prosseguindo com cautela.');
                log.info('Recomendado: `oraculo guardian --diff` e `oraculo guardian --accept-baseline` antes de atualizar.');
            }
            const cmd = opts.global ? 'npm install -g oraculo@latest' : 'npm install oraculo@latest';
            log.info(`📥 Executando: ${cmd}`);
            executarShellSeguro(cmd, { stdio: 'inherit' });
            log.sucesso('✅ Atualização concluída com sucesso!');
        }
        catch (err) {
            log.erro('🚨 Atualização abortada ou falhou.');
            if (typeof err === 'object' &&
                err &&
                'detalhes' in err &&
                Array.isArray(err.detalhes)) {
                err.detalhes.forEach((d) => {
                    log.aviso('❗ ' + d);
                });
            }
            if (config.DEV_MODE)
                console.error(err);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=comando-atualizar.js.map