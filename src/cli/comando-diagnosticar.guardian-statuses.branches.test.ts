import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

import { IntegridadeStatus } from '../tipos/tipos.js';

describe('comandoDiagnosticar – guardian statuses (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  const setup = async (status: IntegridadeStatus) => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      debug: vi.fn(),
      fase: vi.fn(),
      imprimirBloco: vi.fn(),
    } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({
      default: {
        bold: (x: string) => x,
        cyan: { bold: (x: string) => x },
        green: { bold: (x: string) => x },
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: true,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: true, // encerra cedo após guardian
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        // Reqs implicitos
        GUARDIAN_BASELINE: '.oraculo/baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(),
      executarInquisicao: vi.fn(),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status })),
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    return logMock;
  };

  it('status Ok → loga sucesso', async () => {
    const log = await setup(IntegridadeStatus.Ok);
    const joined = log.sucesso.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(joined).toMatch(/Guardian: integridade preservada/);
  });

  it('status Criado → loga info de baseline criado', async () => {
    const log = await setup(IntegridadeStatus.Criado);
    const joined = log.info.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(joined).toMatch(/Guardian baseline criado/);
  });

  it('status Aceito → loga aviso de novo baseline aceito', async () => {
    const log = await setup(IntegridadeStatus.Aceito);
    const joined = log.aviso.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(joined).toMatch(/novo baseline aceito/);
  });

  it('status AlteracoesDetectadas → loga aviso de alterações suspeitas', async () => {
    const log = await setup(IntegridadeStatus.AlteracoesDetectadas);
    const joined = log.aviso.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(joined).toMatch(/alterações suspeitas detectadas/);
  });
});
