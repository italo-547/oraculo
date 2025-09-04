// SPDX-License-Identifier: MIT
// import { log } from '../nucleo/constelacao/log.js';
import { log } from '@nucleo/constelacao/log.js';
export function exibirRelatorioPadroesUso() {
    // Cabeçalho compatível com testes
    log.info('\n📊 Padrões de Uso do Código:');
    // Moldura do cabeçalho (somente em runtime humano)
    if (!process.env.VITEST) {
        const titulo = 'Padrões de Uso do Código';
        const linhas = [];
        const largura = log.calcularLargura
            ? log.calcularLargura(titulo, linhas, 84)
            : undefined;
        log.imprimirBloco(titulo, linhas, (s) => s, typeof largura === 'number' ? largura : 84);
        console.log('');
    }
    // Rodapé compatível com testes
    log.sucesso('\n✅ Fim do relatório de padrões de uso.\n');
}
//# sourceMappingURL=relatorio-padroes-uso.js.map