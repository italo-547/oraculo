import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comandoDiagnosticar - include/exclude', () => {
  it('aplica include sobre exclude corretamente', async () => {
    const comando = comandoDiagnosticar(() => {});
    await comando.parseAsync(['node', 'cli.js', '--include', 'src', '--exclude', 'node_modules']);
  });
});
