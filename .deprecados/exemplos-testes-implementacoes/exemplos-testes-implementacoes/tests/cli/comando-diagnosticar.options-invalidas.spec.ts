import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comandoDiagnosticar - options exclusivas', () => {
  it('deve rejeitar combinação inválida de flags', async () => {
    const comando = comandoDiagnosticar(() => {});
    await expect(
      comando.parseAsync(['node', 'cli.js', '--scan-only', '--aplicar']),
    ).rejects.toThrow(/combinação inválida/i);
  });
});
