import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iniciarInquisicao } from './inquisidor.js';
import { config } from './constelacao/cosmos.js';

vi.mock('./constelacao/log.js', () => ({
    log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));
import { log } from './constelacao/log.js';

vi.mock('./scanner.js', () => ({
    scanRepository: vi.fn(async () => ({
        'src/a.ts': { relPath: 'src/a.ts', fullPath: 'src/a.ts', content: '1' },
        'docs/readme.md': { relPath: 'docs/readme.md', fullPath: 'docs/readme.md', content: 'd' },
    })),
}));
vi.mock('../analistas/registry.js', () => ({ registroAnalistas: [] }));
vi.mock('./parser.js', () => ({ decifrarSintaxe: vi.fn(async () => ({ node: {}, parent: null })) }));

describe('inquisidor logging branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(config, {
            ANALISE_PRIORIZACAO_ENABLED: true,
            ANALISE_INCREMENTAL_STATE_PATH: 'inc-state.json',
            ANALISE_PRIORIZACAO_PESOS: { duracaoMs: 1, ocorrencias: 2, penalidadeReuso: 0.5 },
            LOG_ESTRUTURADO: true,
        });
    });

    it('loga priorização estruturada quando LOG_ESTRUTURADO', async () => {
        const { salvarEstado } = await import('../zeladores/util/persistencia.js');
        await salvarEstado('inc-state.json', {
            arquivos: {
                'src/a.ts': {
                    hash: 'h',
                    ocorrencias: [],
                    analistas: { x: { ocorrencias: 2, duracaoMs: 5 } },
                    reaproveitadoCount: 1,
                },
            },
        });
        await iniciarInquisicao(process.cwd(), { incluirMetadados: false, skipExec: true });
        expect(log.info).toHaveBeenCalledWith(expect.stringContaining('"tipo":"priorizacao"'));
    });
});
