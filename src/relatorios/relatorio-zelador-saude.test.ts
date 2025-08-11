import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exibirRelatorioZeladorSaude } from './relatorio-zelador-saude.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        aviso: vi.fn(),
        sucesso: vi.fn(),
    },
}));
vi.mock('../analistas/analista-padroes-uso.js', () => ({
    estatisticasUsoGlobal: {
        consts: { X: 4, Y: 2 },
        requires: { modA: 5, modB: 1 },
    },
}));

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('exibirRelatorioZeladorSaude', () => {
    it('relata funções longas, consts e requires excessivos', () => {
        const ocorrencias = [
            { relPath: 'a.ts', linha: 10, mensagem: 'Função longa', tipo: 'aviso' },
        ];
        exibirRelatorioZeladorSaude(ocorrencias);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Relatório de Saúde/));
        expect(log.aviso).toHaveBeenCalledWith(expect.stringMatching(/Funções longas/));
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Constantes definidas/));
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Módulos require/));
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Fim do relatório/));
    });

    it('relata ausência de funções longas', () => {
        exibirRelatorioZeladorSaude([]);
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Nenhuma função acima do limite/));
    });
});
