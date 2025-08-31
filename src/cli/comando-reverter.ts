// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { mapaReversao } from '@zeladores/mapa-reversao.js';
import { log } from '@nucleo/constelacao/log.js';

export function registrarComandoReverter(program: Command) {
  program
    .command('reverter')
    .description('Gerencia mapa de reversão para moves aplicados')
    .addCommand(
      new Command('listar')
        .description('Lista todos os moves registrados no mapa de reversão')
        .action(async () => {
          await mapaReversao.carregar();
          const lista = mapaReversao.listarMoves();
          console.log(lista);
        }),
    )
    .addCommand(
      new Command('arquivo')
        .description('Reverte todos os moves de um arquivo específico')
        .argument('<arquivo>', 'Caminho do arquivo para reverter')
        .action(async (arquivo: string) => {
          await mapaReversao.carregar();

          if (!mapaReversao.podeReverterArquivo(arquivo)) {
            log.erro(`❌ Nenhum move encontrado para o arquivo: ${arquivo}`);
            process.exit(1);
          }

          log.info(`🔄 Revertendo moves para: ${arquivo}`);
          const sucesso = await mapaReversao.reverterArquivo(arquivo);

          if (sucesso) {
            log.sucesso(`✅ Arquivo revertido com sucesso: ${arquivo}`);
          } else {
            log.erro(`❌ Falha ao reverter arquivo: ${arquivo}`);
            process.exit(1);
          }
        }),
    )
    .addCommand(
      new Command('move')
        .description('Reverte um move específico pelo ID')
        .argument('<id>', 'ID do move para reverter')
        .action(async (id: string) => {
          await mapaReversao.carregar();

          log.info(`🔄 Revertendo move: ${id}`);
          const sucesso = await mapaReversao.reverterMove(id);

          if (sucesso) {
            log.sucesso(`✅ Move revertido com sucesso: ${id}`);
          } else {
            log.erro(`❌ Falha ao reverter move: ${id}`);
            process.exit(1);
          }
        }),
    )
    .addCommand(
      new Command('limpar')
        .description('Limpa todo o mapa de reversão (perde histórico)')
        .option('-f, --force', 'Não pede confirmação')
        .action(async (options: { force?: boolean }) => {
          await mapaReversao.carregar();

          if (!options.force) {
            console.log('⚠️  ATENÇÃO: Esta ação irá remover todo o histórico de reversão.');
            console.log('   Não será possível reverter moves futuros sem o histórico.');
            console.log('');
            console.log('Use --force para confirmar ou pressione Ctrl+C para cancelar.');
            process.exit(1);
          }

          await mapaReversao.limpar();
          log.sucesso('🧹 Mapa de reversão limpo com sucesso');
        }),
    )
    .addCommand(
      new Command('status').description('Mostra status do mapa de reversão').action(async () => {
        await mapaReversao.carregar();
        const moves = mapaReversao.obterMoves();

        console.log('📊 Status do Mapa de Reversão');
        console.log('==============================');
        console.log(`Total de moves: ${moves.length}`);

        if (moves.length > 0) {
          const ultimoMove = moves.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )[0];

          console.log(`Último move: ${new Date(ultimoMove.timestamp).toLocaleString('pt-BR')}`);
          console.log(`Arquivo: ${ultimoMove.destino}`);
          console.log(`Motivo: ${ultimoMove.motivo}`);
        }

        console.log('');
        console.log('💡 Comandos disponíveis:');
        console.log('  oraculo reverter listar    - Lista todos os moves');
        console.log('  oraculo reverter arquivo <arquivo> - Reverte moves de um arquivo');
        console.log('  oraculo reverter move <id> - Reverte move específico');
        console.log('  oraculo reverter limpar --force - Limpa histórico');
      }),
    );
}
