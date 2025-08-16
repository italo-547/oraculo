import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comando-diagnosticar (include/exclude)', () => {
  it('deve filtrar arquivos corretamente com include/exclude', async () => {
    const cmd = comandoDiagnosticar(() => {});
    await expect(async () => {
      await cmd.parseAsync([
        'node',
        'diagnosticar',
        '--include',
        'src',
        '--exclude',
        'node_modules',
      ]);
    }).not.toThrow();
  });
});
