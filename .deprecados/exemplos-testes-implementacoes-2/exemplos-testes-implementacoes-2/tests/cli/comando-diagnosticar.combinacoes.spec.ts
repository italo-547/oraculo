import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar';

describe('comandoDiagnosticar - combinações de options', () => {
  it('deve rodar com --json e --compact sem erros', async () => {
    const comando = comandoDiagnosticar(() => {});
    await comando.parseAsync(['node', 'cli.js', '--json', '--compact']);
    // Verifique saída, logs, etc. (mock de logs se necessário)
  });

  it('deve aceitar --full-scan e --include node_modules', async () => {
    const comando = comandoDiagnosticar(() => {});
    await comando.parseAsync(['node', 'cli.js', '--full-scan', '--include', 'node_modules']);
    // Verifique comportamento esperado
  });

  it('deve mostrar erro quando opções inválidas são combinadas', async () => {
    const comando = comandoDiagnosticar(() => {});
    await expect(comando.parseAsync(['node', 'cli.js', '--json', '--export-md'])).rejects.toThrow();
    // Adapte conforme regras reais de combinação
  });

  // Adicione mais casos conforme surgirem novas opções/comportamentos
});
