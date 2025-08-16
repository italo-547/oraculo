import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comando-diagnosticar (combinações)', () => {
  it('deve aceitar múltiplas flags e executar sem erro', async () => {
    const cmd = comandoDiagnosticar(() => {});
    await expect(async () => {
      await cmd.parseAsync(['node', 'diagnosticar', '--scan-only', '--json', '--verbose']);
    }).not.toThrow();
  });
});
