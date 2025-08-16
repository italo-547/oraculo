import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comandoDiagnosticar - include/exclude', () => {
  it('aplica include sobre exclude corretamente', async () => {
    const comando = comandoDiagnosticar(() => {});
    await comando.parseAsync(['node', 'cli.js', '--include', 'src', '--exclude', 'node_modules']);
    // Aqui o teste pode verificar se 'src' foi incluído mesmo que excluído por padrão
    // Use spies/mocks para garantir comportamento correto
  });
});
