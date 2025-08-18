// SPDX-License-Identifier: MIT
// import { log } from '../nucleo/constelacao/log.js';

import { log } from '../nucleo/constelacao/log.js';

export function exibirRelatorioPadroesUso(): void {
  // Cabeçalho compatível com testes
  log.info('\n📊 Padrões de Uso do Código:');
  // Moldura do cabeçalho (somente em runtime humano)
  if (!process.env.VITEST) {
    const titulo = 'Padrões de Uso do Código';
    const linhas: string[] = [];
    const largura = (log as unknown as { calcularLargura?: Function }).calcularLargura
      ? (log as unknown as { calcularLargura: Function }).calcularLargura(titulo, linhas, 84)
      : undefined;
    (log as unknown as { imprimirBloco: Function }).imprimirBloco(
      titulo,
      linhas,
      (s: string) => s,
      typeof largura === 'number' ? largura : 84,
    );
    console.log('');
  }
  // Rodapé compatível com testes
  log.sucesso('\n✅ Fim do relatório de padrões de uso.\n');
}
