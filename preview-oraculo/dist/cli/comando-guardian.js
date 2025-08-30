// SPDX-License-Identifier: MIT
import chalk from '../nucleo/constelacao/chalk-safe.js';
import { Command } from 'commander';
import { IntegridadeStatus } from '../tipos/tipos.js';
import { acceptNewBaseline, scanSystemIntegrity } from '../guardian/sentinela.js';
import { config } from '../nucleo/constelacao/cosmos.js';
import { log } from '../nucleo/constelacao/log.js';
import { iniciarInquisicao } from '../nucleo/inquisidor.js';
export function comandoGuardian(aplicarFlagsGlobais) {
    return (new Command('guardian')
        .description('Gerencia e verifica a integridade do ambiente do Oráculo.')
        // Alinhar com comportamento tolerante usado em outros comandos/testes
        .allowUnknownOption(true)
        .allowExcessArguments(true)
        .option('-a, --accept-baseline', 'Aceita o baseline atual como o novo baseline de integridade')
        .option('-d, --diff', 'Mostra as diferenças entre o estado atual e o baseline')
        .option('--full-scan', 'Executa verificação sem aplicar GUARDIAN_IGNORE_PATTERNS (não persistir baseline)')
        .option('--json', 'Saída em JSON estruturado (para CI/integracoes)')
        .action(async function (opts) {
        aplicarFlagsGlobais(this.parent && typeof this.parent.opts === 'function' ? this.parent.opts() : {});
        const baseDir = process.cwd();
        let fileEntries = [];
        try {
            const resultadoInquisicao = await iniciarInquisicao(baseDir, { incluirMetadados: false });
            fileEntries = resultadoInquisicao.fileEntries;
            const ignoradosOriginaisRaw = config
                .GUARDIAN_IGNORE_PATTERNS;
            const ignoradosOriginais = Array.isArray(ignoradosOriginaisRaw)
                ? [...ignoradosOriginaisRaw]
                : [];
            if (opts.fullScan) {
                // Temporariamente desabilita padrões ignorados
                config.GUARDIAN_IGNORE_PATTERNS =
                    [];
                if (!opts.acceptBaseline) {
                    log.aviso('⚠️ --full-scan ativo: baseline NÃO será persistido com escopo expandido.');
                }
            }
            if (opts.acceptBaseline) {
                if (opts.fullScan) {
                    log.aviso('🚫 Não é permitido aceitar baseline em modo --full-scan. Remova a flag e repita.');
                    config.GUARDIAN_IGNORE_PATTERNS = ignoradosOriginais;
                    process.exit(1);
                }
                log.info(chalk.bold('\n🔄 Aceitando novo baseline de integridade...\n'));
                await acceptNewBaseline(fileEntries);
                if (opts.json) {
                    console.log(JSON.stringify({ status: IntegridadeStatus.Aceito, baseline: true }));
                }
                else {
                    log.sucesso('🔒 Novo baseline de integridade aceito com sucesso!');
                }
            }
            else if (opts.diff) {
                log.info(chalk.bold('\n📊 Comparando integridade do Oráculo com o baseline...\n'));
                const diffResult = await scanSystemIntegrity(fileEntries, {
                    justDiff: true,
                    suppressLogs: opts.json,
                });
                const statusDiff = String(diffResult?.status || '').toLowerCase();
                const alteracoes = statusDiff === String(IntegridadeStatus.AlteracoesDetectadas).toLowerCase() ||
                    statusDiff.includes('alterac') ||
                    statusDiff.includes('diferen');
                if (alteracoes && diffResult.detalhes && diffResult.detalhes.length) {
                    if (opts.json) {
                        console.log(JSON.stringify({
                            status: 'alteracoes-detectadas',
                            detalhes: diffResult.detalhes,
                        }));
                    }
                    else {
                        log.aviso('🚨 Diferenças detectadas:');
                        diffResult.detalhes?.forEach((d) => {
                            log.info(`  - ${d}`);
                        });
                        log.aviso('Execute `oraculo guardian --accept-baseline` para aceitar essas mudanças.');
                    }
                    process.exit(1);
                }
                else {
                    if (opts.json) {
                        console.log(JSON.stringify({ status: 'ok', detalhes: [] }));
                    }
                    else {
                        log.sucesso('✅ Nenhuma diferença detectada. Integridade preservada.');
                    }
                }
            }
            else {
                log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
                const guardianResultado = await scanSystemIntegrity(fileEntries, {
                    suppressLogs: opts.json,
                });
                const statusRaw = String(guardianResultado?.status || '').toLowerCase();
                const statusNorm = (() => {
                    if (statusRaw === String(IntegridadeStatus.Ok).toLowerCase() || statusRaw === 'ok')
                        return IntegridadeStatus.Ok;
                    if (statusRaw === String(IntegridadeStatus.Criado).toLowerCase() ||
                        statusRaw.includes('baseline-criado'))
                        return IntegridadeStatus.Criado;
                    if (statusRaw === String(IntegridadeStatus.Aceito).toLowerCase() ||
                        statusRaw.includes('baseline-aceito'))
                        return IntegridadeStatus.Aceito;
                    if (statusRaw === String(IntegridadeStatus.AlteracoesDetectadas).toLowerCase() ||
                        statusRaw.includes('alterac'))
                        return IntegridadeStatus.AlteracoesDetectadas;
                    return IntegridadeStatus.Ok;
                })();
                switch (statusNorm) {
                    case IntegridadeStatus.Ok:
                        if (opts.json)
                            console.log(JSON.stringify({
                                status: 'ok',
                                cacheDiffHits: globalThis
                                    .__ORACULO_DIFF_CACHE_HITS__ || 0,
                            }));
                        else
                            log.sucesso('🔒 Guardian: integridade preservada.');
                        break;
                    case IntegridadeStatus.Criado:
                        if (opts.json)
                            console.log(JSON.stringify({
                                status: 'baseline-criado',
                                cacheDiffHits: globalThis
                                    .__ORACULO_DIFF_CACHE_HITS__ || 0,
                            }));
                        else
                            log.info('📘 Guardian baseline criado');
                        log.aviso('Execute `oraculo guardian --accept-baseline` para aceitá-lo ou `oraculo diagnosticar` novamente.');
                        break;
                    case IntegridadeStatus.Aceito:
                        if (opts.json)
                            console.log(JSON.stringify({
                                status: 'baseline-aceito',
                                cacheDiffHits: globalThis
                                    .__ORACULO_DIFF_CACHE_HITS__ || 0,
                            }));
                        else
                            log.sucesso('🌀 Guardian: baseline atualizado e aceito');
                        break;
                    case IntegridadeStatus.AlteracoesDetectadas: {
                        if (opts.json) {
                            console.log(JSON.stringify({
                                status: 'alteracoes-detectadas',
                                cacheDiffHits: globalThis
                                    .__ORACULO_DIFF_CACHE_HITS__ || 0,
                            }));
                        }
                        else {
                            log.aviso('🚨 Guardian: alterações suspeitas detectadas!');
                        }
                        process.exit(1);
                    }
                }
            }
            if (opts.fullScan) {
                // Restaura padrões originais após execução
                config.GUARDIAN_IGNORE_PATTERNS =
                    ignoradosOriginais;
            }
        }
        catch (err) {
            log.erro(`❌ Erro no Guardian: ${err.message ?? String(err)}`);
            if (config.DEV_MODE)
                console.error(err);
            if (opts.json)
                console.log(JSON.stringify({ status: 'erro', mensagem: err.message }));
            process.exit(1);
        }
    }));
}
//# sourceMappingURL=comando-guardian.js.map