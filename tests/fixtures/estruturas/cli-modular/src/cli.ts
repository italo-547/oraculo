// Fixture mínimo para arquétipo cli-modular
// Importa commander para sinalizar heurística de CLI
import { Command } from 'commander';

export const program = new Command()
  .name('fixture-cli')
  .description('Fixture CLI modular')
  .version('0.0.0');

export function main() {
  // implementação mínima
  return 'ok';
}
