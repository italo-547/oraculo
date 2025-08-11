import { log } from '../nucleo/constelacao/log.js';



/**
 * Emite o relatório de padrões de uso após as análises
 */
export function exibirRelatorioPadroesUso(): void {
  log.info('\\n📊 Padrões de Uso do Código:');
  // registrarTop('Top Requires', globalUsageStats.requires);
  // registrarTop('Top Constantes', globalUsageStats.consts);
  // registrarTop('Top Exports', globalUsageStats.exports);
  log.sucesso('\\n✅ Fim do relatório de padrões de uso.\\n');
}