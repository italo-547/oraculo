import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoDiagnosticar } from './comando-diagnosticar.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
    },
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../nucleo/inquisidor.js', () => ({
    iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
    executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
    tecnicas: [],
}));
vi.mock('../guardian/sentinela.js', () => ({ scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })) }));
vi.mock('../arquitetos/analista-estrutura.js', () => ({ alinhamentoEstrutural: vi.fn(() => []) }));
vi.mock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn(() => ({ tipo: 'cli', sinais: [], confiabilidade: 1 })) }));
vi.mock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: vi.fn(() => []) }));
vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn(() => 'relatorio estrutura') }));
vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({ exibirRelatorioZeladorSaude: vi.fn() }));
vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
vi.mock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
vi.mock('../relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));
vi.mock('../zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoDiagnosticar', () => {
    it('executa diagnóstico completo sem erros', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'diagnosticar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Iniciando diagnóstico completo/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });
});
