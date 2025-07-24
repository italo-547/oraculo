#!/usr/bin/env node
// 🌌 MÓDULOS INTERNOS
import { corrigirEstrutura } from './zeladores/corretor-estrutura';
import { scanSystemIntegrity, acceptNewBaseline } from './guardian/sentinela'; // Adicionado acceptNewBaseline
import { executarInquisicao, tecnicas, iniciarInquisicao } from './nucleo/inquisidor';
import { sinaisDetectados } from './analistas/detector-estrutura';
import { diagnosticarProjeto } from './arquitetos/diagnostico-projeto';
import { alinhamentoEstrutural } from './arquitetos/analista-estrutura';
import { removerArquivosOrfaos } from './zeladores/poda'; // Importado para o comando poda
import { gerarRelatorioEstrutura } from './relatorios/relatorio-estrutura';
import { exibirRelatorioZeladorSaude } from './relatorios/relatorio-zelador-saude';
import { exibirRelatorioPadroesUso } from './relatorios/relatorio-padroes-uso';
import { emitirConselhoOracular } from './relatorios/conselheiro-oracular';
import { gerarRelatorioMarkdown } from './relatorios/gerador-relatorio';
import config from './nucleo/constelacao/cosmos';
import log from './nucleo/constelacao/log';
// 🧩 DEPENDÊNCIAS EXTERNAS
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
// 🛠️ CONFIGURAÇÃO DO CLI
const program = new Command();
program
    .name(chalk.magenta('oraculo'))
    .version('1.0.0')
    .description('A ferramenta Oráculo: análise, reestruturação e proteção de repositórios.') // Adicionando descrição geral
    .option('-s, --silence', 'silencia logs de informação e aviso')
    .option('-e, --export', 'gera arquivos de relatório detalhados (JSON e Markdown)')
    .option('-d, --dev', 'ativa modo de desenvolvimento (logs de debug)');
// Função para aplicar flags globais
function aplicarFlagsGlobais(opts) {
    config.REPORT_SILENCE_LOGS = opts.silence ?? false;
    config.REPORT_EXPORT_ENABLED = opts.export ?? false;
    config.DEV_MODE = opts.dev ?? false;
    // Remover flags --alinhamentos, --guardian, --poda daqui, pois se tornarão comandos ou opções específicas de comandos.
}
// ---
// 🔍 COMANDO: diagnosticar
const comandoDiagnosticar = new Command('diagnosticar')
    .alias('diag')
    .description('Executa uma análise completa do repositório')
    .option('-g, --guardian-check', 'Ativa a verificação de integridade do Guardian durante o diagnóstico') // Opção específica
    .action(async (opts) => {
    aplicarFlagsGlobais(program.opts()); // Aplica as flags globais da raiz
    config.GUARDIAN_ENABLED = opts.guardianCheck ?? false; // Aplica a opção do Guardian para este comando
    log.info(chalk.bold('\n🔍 Iniciando diagnóstico completo...\n'));
    const baseDir = process.cwd();
    let guardianResultado;
    let fileEntries = [];
    let totalOcorrencias = 0; // Para contar os problemas
    try {
        // 1️⃣ Leitura inicial sem AST
        const leituraInicial = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        fileEntries = leituraInicial.fileEntries;
        // 2️⃣ Guardian: valida integridade se ativado
        if (config.GUARDIAN_ENABLED) {
            log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
            try {
                guardianResultado = await scanSystemIntegrity(fileEntries);
                switch (guardianResultado.status) {
                    case 'ok':
                        log.sucesso('🔒 Guardian: integridade preservada.');
                        break;
                    case 'baseline-criado':
                        log.info('📘 Guardian: baseline inicial criado.');
                        break;
                    case 'baseline-aceito':
                        log.aviso('🌀 Guardian: novo baseline aceito — execute novamente.');
                        break;
                    case 'alteracoes-detectadas': // Adicionar este status no seu 'sentinela.ts'
                        log.alerta('🚨 Guardian: alterações suspeitas detectadas! Considere executar `oraculo guardian --diff`.');
                        totalOcorrencias++; // Conta como uma ocorrência
                        break;
                }
            }
            catch (err) {
                log.erro('🚨 Guardian bloqueou: alterações suspeitas detectadas ou erro fatal.');
                if (config.GUARDIAN_ENFORCE_PROTECTION && err.detalhes) {
                    err.detalhes.forEach((d) => log.aviso('❗ ' + d));
                    process.exit(1);
                }
                else {
                    log.aviso('⚠️ Modo permissivo: prosseguindo sob risco.');
                }
            }
        }
        // 3️⃣ Leitura com AST
        const { fileEntries: fileEntriesComAst } = await iniciarInquisicao(baseDir, { incluirMetadados: true });
        // 4️⃣ Executa todas técnicas e retorna resultado final
        const resultadoFinal = await executarInquisicao(fileEntriesComAst, tecnicas, baseDir, guardianResultado);
        totalOcorrencias += resultadoFinal.ocorrencias.length; // Soma as ocorrências das análises
        // 5️⃣ Relatórios analíticos
        log.info(chalk.bold('\n📊 Gerando relatórios analíticos...\n'));
        const alinhamentos = await alinhamentoEstrutural(fileEntriesComAst, baseDir);
        await gerarRelatorioEstrutura(alinhamentos);
        await exibirRelatorioZeladorSaude(resultadoFinal.ocorrencias);
        await exibirRelatorioPadroesUso();
        await diagnosticarProjeto(sinaisDetectados);
        // 6️⃣ Conselho final - passar dados mais relevantes
        await emitirConselhoOracular({
            hora: new Date().getHours(),
            arquivosParaCorrigir: resultadoFinal.ocorrencias.length,
            arquivosParaPodar: resultadoFinal.arquivosOrfaosDetectados?.length || 0, // Supondo que você detecte órfãos aqui
            totalOcorrenciasAnaliticas: resultadoFinal.ocorrencias.length,
            integridadeGuardian: guardianResultado?.status || 'nao-verificado'
        });
        // 7️⃣ Exporta relatórios se habilitado
        if (config.REPORT_EXPORT_ENABLED) {
            log.info(chalk.bold('\n💾 Exportando relatórios detalhados...\n'));
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const dir = config.REPORT_OUTPUT_DIR || path.join(baseDir, 'oraculo-reports'); // Garantir um diretório padrão
            const nome = `oraculo-relatorio-${ts}`;
            await fs.mkdir(dir, { recursive: true });
            // Gerar JSON mais compacto
            const relatorioCompacto = {
                resumo: {
                    totalArquivos: fileEntriesComAst.length,
                    totalOcorrencias: resultadoFinal.ocorrencias.length,
                    tiposOcorrencias: Object.fromEntries(Object.entries(resultadoFinal.ocorrencias.reduce((acc, occ) => {
                        acc[occ.tipoOcorrencia] = (acc[occ.tipoOcorrencia] || 0) + 1;
                        return acc;
                    }, {})).sort(([, a], [, b]) => b - a)),
                    arquivosComProblemas: new Set(resultadoFinal.ocorrencias.map(o => o.filePath)).size,
                    integridadeGuardian: guardianResultado?.status || 'nao-verificado',
                    baselineModificado: guardianResultado?.baselineModificado || false,
                    arquivosOrfaosDetectados: resultadoFinal.arquivosOrfaosDetectados?.length || 0,
                },
                detalhesOcorrencias: resultadoFinal.ocorrencias.map(occ => ({
                    filePath: occ.filePath,
                    tipoOcorrencia: occ.tipoOcorrencia,
                    mensagem: occ.mensagem,
                    linha: occ.linha,
                    coluna: occ.coluna,
                    // Remova dados muito verbosos como ASTs completas aqui
                })),
                // Inclua outros resumos ou agregados necessários
            };
            await gerarRelatorioMarkdown(resultadoFinal, path.join(dir, `${nome}.md`));
            await fs.writeFile(path.join(dir, `${nome}.json`), JSON.stringify(relatorioCompacto, null, 2)); // JSON formatado
            log.sucesso(`Relatórios exportados para: ${dir}`);
        }
        // Feedback final melhorado
        if (totalOcorrencias === 0) {
            log.sucesso(chalk.bold('\n✨ Oráculo: Repositório impecável! Nenhum problema detectado.\n'));
        }
        else {
            log.alerta(chalk.bold(`\n⚠️ Oráculo: Diagnóstico concluído. ${totalOcorrencias} problema(s) detectado(s).`));
            log.info('Revise os relatórios acima ou exportados para mais detalhes.');
            process.exit(1); // Opcional: sair com erro se problemas forem encontrados
        }
    }
    catch (error) {
        log.erro(`❌ Erro fatal durante o diagnóstico: ${error.message}`);
        if (config.DEV_MODE)
            console.error(error); // Mostrar stack trace em modo dev
        process.exit(1);
    }
});
program.addCommand(comandoDiagnosticar);
// ---
// 🛡️ COMANDO: guardian
const comandoGuardian = new Command('guardian')
    .description('Gerencia e verifica a integridade do ambiente do Oráculo.')
    .option('-a, --accept-baseline', 'Aceita o baseline atual como o novo baseline de integridade')
    .option('-d, --diff', 'Mostra as diferenças entre o estado atual e o baseline') // Nova opção
    .action(async (opts) => {
    aplicarFlagsGlobais(program.opts()); // Aplica flags globais
    const baseDir = process.cwd();
    try {
        const { fileEntries } = await iniciarInquisicao(baseDir, { incluirMetadados: false }); // Não precisa de AST para integridade
        if (opts.acceptBaseline) {
            log.info(chalk.bold('\n🔄 Aceitando novo baseline de integridade...\n'));
            await acceptNewBaseline(fileEntries); // Você precisará implementar esta função no seu sentinela.ts
            log.sucesso('🔒 Novo baseline de integridade aceito com sucesso!');
        }
        else if (opts.diff) {
            log.info(chalk.bold('\n📊 Comparando integridade do Oráculo com o baseline...\n'));
            // Você precisará de uma função no Guardian para gerar e exibir o diff
            const diffResult = await scanSystemIntegrity(fileEntries, { justDiff: true }); // Assumindo uma opção 'justDiff'
            if (diffResult.status === 'alteracoes-detectadas' && diffResult.detalhes) {
                log.aviso('🚨 Diferenças detectadas:');
                diffResult.detalhes.forEach((d) => log.info(`  - ${d}`));
                log.alerta('Execute `oraculo guardian --accept-baseline` para aceitar essas mudanças.');
                process.exit(1);
            }
            else {
                log.sucesso('✅ Nenhuma diferença detectada. Integridade preservada.');
            }
        }
        else {
            log.info(chalk.bold('\n🛡️ Verificando integridade do Oráculo...\n'));
            const guardianResultado = await scanSystemIntegrity(fileEntries);
            switch (guardianResultado.status) {
                case 'ok':
                    log.sucesso('🔒 Guardian: integridade preservada.');
                    break;
                case 'baseline-criado':
                    log.info('📘 Guardian: baseline inicial criado.');
                    log.aviso('Execute `oraculo guardian --accept-baseline` para aceitá-lo ou `oraculo diagnosticar` novamente.');
                    break;
                case 'baseline-aceito':
                    log.sucesso('🌀 Guardian: baseline atualizado e aceito.'); // Este status é mais para o diagnosticar. Aqui, ok.
                    break;
                case 'alteracoes-detectadas':
                    log.alerta('🚨 Guardian: alterações suspeitas detectadas! Execute `oraculo guardian --diff` para ver detalhes.');
                    totalOcorrencias++;
                    break;
                    process.exit(1);
            }
        }
    }
    catch (err) {
        log.erro(`❌ Erro no Guardian: ${err.message}`);
        if (config.DEV_MODE)
            console.error(err);
        process.exit(1);
    }
});
program.addCommand(comandoGuardian);
// ---
// 🌳 COMANDO: podar
const comandoPodar = new Command('podar')
    .description('Remove arquivos órfãos e lixo do repositório.')
    .option('-f, --force', 'Remove arquivos sem confirmação (CUIDADO!)', false)
    .action(async (opts) => {
    aplicarFlagsGlobais(program.opts());
    log.info(chalk.bold('\n🌳 Iniciando processo de poda...\n'));
    const baseDir = process.cwd();
    try {
        const { fileEntries } = await iniciarInquisicao(baseDir, { incluirMetadados: false }); // Ou true, dependendo da detecção
        const resultadoPoda = await removerArquivosOrfaos(fileEntries); // Essa função precisa ser implementada para detectar e retornar os órfãos
        if (resultadoPoda.arquivosOrfaos.length === 0) {
            log.sucesso('🎉 Nenhuma sujeira detectada. Repositório limpo!');
            return;
        }
        log.aviso(`\n${resultadoPoda.arquivosOrfaos.length} arquivos órfãos detectados:`);
        resultadoPoda.arquivosOrfaos.forEach((file) => log.info(`- ${file}`));
        if (!opts.force) {
            const readline = await import('node:readline/promises');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const answer = await rl.question(chalk.yellow('Tem certeza que deseja remover esses arquivos? (s/N) '));
            rl.close();
            if (answer.toLowerCase() !== 's') {
                log.info('❌ Poda cancelada.');
                return;
            }
        }
        await removerArquivosOrfaos(fileEntries, true); // Chamar a função novamente para realmente remover (ou passar uma flag)
        log.sucesso('✅ Poda concluída: Arquivos órfãos removidos com sucesso!');
    }
    catch (error) {
        log.erro(`❌ Erro durante a poda: ${error.message}`);
        if (config.DEV_MODE)
            console.error(error);
        process.exit(1);
    }
});
program.addCommand(comandoPodar);
// ---
// ⚙️ COMANDO: reestruturar
const comandoReestruturar = new Command('reestruturar')
    .description('Aplica correções estruturais e otimizações ao repositório.')
    .option('-a, --auto', 'Aplica correções automaticamente sem confirmação (CUIDADO!)', false)
    .action(async (opts) => {
    aplicarFlagsGlobais(program.opts());
    log.info(chalk.bold('\n⚙️ Iniciando processo de reestruturação...\n'));
    const baseDir = process.cwd();
    try {
        // AQUI: Você precisaria de um passo de análise para determinar o que precisa ser corrigido.
        // Poderia reusar partes do `diagnosticar` ou ter uma análise específica.
        const { fileEntries } = await iniciarInquisicao(baseDir, { incluirMetadados: true });
        const analiseParaCorrecao = await executarInquisicao(fileEntries, tecnicas, baseDir); // Ou um subset de tecnicas
        if (analiseParaCorrecao.ocorrencias.length === 0) {
            log.sucesso('🎉 Nenhuma correção estrutural necessária. Repositório já otimizado!');
            return;
        }
        log.aviso(`\n${analiseParaCorrecao.ocorrencias.length} problemas estruturais detectados para correção:`);
        analiseParaCorrecao.ocorrencias.forEach((occ) => log.info(`- [${occ.tipoOcorrencia}] ${occ.filePath}: ${occ.mensagem}`));
        if (!opts.auto) {
            const readline = await import('node:readline/promises');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const answer = await rl.question(chalk.yellow('Tem certeza que deseja aplicar essas correções? (s/N) '));
            rl.close();
            if (answer.toLowerCase() !== 's') {
                log.info('❌ Reestruturação cancelada.');
                return;
            }
        }
        const resultadoCorrecao = await corrigirEstrutura(analiseParaCorrecao.ocorrencias); // 'corrigirEstrutura' precisará de uma lista de ocorrências para agir
        log.sucesso(`✅ Reestruturação concluída: ${resultadoCorrecao.correcoesAplicadas} correções aplicadas.`);
    }
    catch (error) {
        log.erro(`❌ Erro durante a reestruturação: ${error.message}`);
        if (config.DEV_MODE)
            console.error(error);
        process.exit(1);
    }
});
program.addCommand(comandoReestruturar);
// ---
// 🔄 COMANDO: atualizar
const comandoAtualizar = new Command('atualizar')
    .description('Atualiza o Oráculo se a integridade estiver preservada')
    .option('--global', 'atualiza globalmente via npm i -g')
    .action(async (opts) => {
    aplicarFlagsGlobais(program.opts());
    log.info(chalk.bold('\n🔄 Iniciando processo de atualização...\n'));
    const baseDir = process.cwd();
    try {
        // 1️⃣ Verifica integridade antes de atualizar
        const { fileEntries } = await iniciarInquisicao(baseDir, { incluirMetadados: false });
        const guardianResultado = await scanSystemIntegrity(fileEntries);
        if (guardianResultado.status === 'ok' ||
            guardianResultado.status === 'baseline-aceito') {
            log.sucesso('🔒 Guardian: integridade validada. Prosseguindo atualização.');
        }
        else {
            log.aviso('🌀 Guardian gerou novo baseline ou detectou alterações. Prosseguindo com cautela.');
            log.info('Recomendado: `oraculo guardian --diff` e `oraculo guardian --accept-baseline` antes de atualizar.');
            // Opcional: perguntar ao usuário se deseja continuar
        }
        // 2️⃣ Atualiza via NPM
        const cmd = opts.global
            ? 'npm install -g oraculo@latest'
            : 'npm install oraculo@latest';
        log.info(`📥 Executando: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
        log.sucesso('✅ Atualização concluída com sucesso!');
    }
    catch (err) {
        log.erro('🚨 Atualização abortada ou falhou.');
        if (err.detalhes)
            err.detalhes.forEach((d) => log.aviso('❗ ' + d));
        if (config.DEV_MODE)
            console.error(err);
        process.exit(1);
    }
});
program.addCommand(comandoAtualizar);
// 🚀 Dispara CLI principal
program.parseAsync(process.argv);
