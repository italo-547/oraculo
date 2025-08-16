import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comando-diagnosticar (opções inválidas)', () => {
  it('deve lidar com opções inválidas sem lançar erro fatal', async () => {
    const cmd = comandoDiagnosticar(() => {});
    await expect(async () => {
      await cmd.parseAsync(['node', 'diagnosticar', '--flagInvalida']);
    }).not.toThrow();
  });
});
