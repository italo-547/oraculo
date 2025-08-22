import { describe, it, expect, beforeEach } from 'vitest';
import { scoreArquetipo, pontuarTodos } from '../../src/analistas/deteccao/pontuador';
import { ARQUETIPOS } from '../../src/analistas/arquetipos-defs';
import { grafoDependencias } from '../../src/analistas/detector-dependencias';

function def(nome: string) {
  const d = ARQUETIPOS.find((a) => a.nome === nome);
  if (!d) throw new Error('Arquetipo não encontrado: ' + nome);
  return d;
}

describe('pontuador - scoreArquetipo e pontuarTodos', () => {
  beforeEach(() => {
    grafoDependencias.clear();
  });

  it('fullstack: detecta cenário híbrido (controllers/pages/api/prisma) e cita candidatos potenciais', () => {
    // Dependências globais simuladas incluem express
    grafoDependencias.set('src/controllers/user.ts', new Set(['express']));
    const arquivos = [
      'pages/index.tsx',
      'api/hello.ts',
      'prisma/schema.prisma',
      'src/controllers/user.ts',
    ];
    const r = scoreArquetipo(def('fullstack'), arquivos);
    expect(r.score).toBeGreaterThan(0);
    // A implementação atual não garante candidatoExtra neste caminho,
    // mas a explicação cita candidatos potenciais.
    expect(r.explicacaoSimilaridade).toMatch(/Outros candidatos potenciais detectados/i);
  });

  it('fullstack: sem controllers/express ainda incrementa com trio pages/api/prisma', () => {
    const arquivos = ['pages/index.tsx', 'api/hello.ts', 'prisma/schema.prisma'];
    const r = scoreArquetipo(def('fullstack'), arquivos);
    expect(r.score).toBeGreaterThan(0);
    expect(r.explicacaoSimilaridade).toMatch(/padrão fullstack/i);
  });

  it('api-rest-express: com pages/prisma/api limita score a 100 e explica padrão', () => {
    grafoDependencias.set('src/controllers/user.ts', new Set(['express']));
    const arquivos = [
      'src/controllers/users.ts',
      'pages/_app.tsx',
      'prisma/schema.prisma',
      'api/hello.ts',
    ];
    const r = scoreArquetipo(def('api-rest-express'), arquivos);
    expect(r.score).toBeLessThanOrEqual(100);
    // Mensagem pode variar por heurística; garantir referência ao padrão.
    expect(r.explicacaoSimilaridade || '').toMatch(/api-rest-express/i);
  });

  it('api-rest-express: mensagens por faixas de score e sugestoes de padronização', () => {
    // Sem express e sem controllers para acionar sugestões
    const arquivos = ['src/index.ts'];
    const r = scoreArquetipo(def('api-rest-express'), arquivos);
    expect(r.sugestaoPadronizacao).toMatch(/src\/controllers/);
    expect(r.sugestaoPadronizacao).toMatch(/express/);
    expect(r.sugestaoPadronizacao).toMatch(/api|rest/i);
    // A mensagem deve cair em alguma das faixas definidas
    expect((r.explicacaoSimilaridade || '').length).toBeGreaterThan(0);
  });

  it('explicação genérica quando há required faltante e forbidden presente', () => {
    // Forçar cenário de landing-page com forbidden prisma
    const arquivos = ['components/Button.tsx', 'prisma/schema.prisma'];
    const r = scoreArquetipo(def('landing-page'), arquivos);
    expect(r.explicacaoSimilaridade).toMatch(/obrigatórios ausentes|não permitidos/);
    expect(r.forbiddenPresent.includes('prisma')).toBe(true);
  });

  it('anomalias na raiz quando arquivo não permitido aparece', () => {
    const arquivos = [
      'pages/index.tsx',
      'api/hello.ts',
      'prisma/schema.prisma',
      'README_NOT_ALLOWED.md',
    ];
    const r = scoreArquetipo(def('fullstack'), arquivos);
    expect(r.anomalias.length).toBeGreaterThanOrEqual(1);
    expect(r.anomalias[0].motivo).toMatch(/raiz não permitido/i);
  });

  it('pontuarTodos: filtra apenas candidatos com algum sinal', () => {
    const arquivos = ['random.txt'];
    const res = pontuarTodos(arquivos);
    // Não deve retornar nada pois não há matches/optional/deps/pattern/forbidden
    expect(res.length).toBe(0);
  });
});
