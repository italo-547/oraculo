import { log } from '../nucleo/constelacao/log.js';
import { config } from '../nucleo/constelacao/cosmos.js';

<<<<<<< HEAD
const TOP_N = typeof config.VIGIA_TOP_N === 'number' ? config.VIGIA_TOP_N : 10;
=======
const TOP_N = config.VIGIA_TOP_N ?? 10;
>>>>>>> 0fbb13cfd80dd0e692bdfff5027ea6ce8bd0bddd

type Contador = Record<string, number>;

/**
 * Exibe os N itens mais usados de uma categoria
 */
function registrarTop(titulo: string, contador: Contador): void {
  const entradas = Object.entries(contador)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N);

  if (entradas.length === 0) {
    log.info(`\\n📌 ${titulo}\\n  (nenhum uso identificado)`);
    return;
  }

  log.info(`\\n📌 ${titulo}`);
  for (const [nome, total] of entradas) {
    log.info(`  - ${nome}: ${total}`);
  }
}

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