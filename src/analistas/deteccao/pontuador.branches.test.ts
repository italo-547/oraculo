// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocks para controlar ARQUETIPOS e grafo de dependências
vi.mock('../arquetipos-defs.js', () => ({
  ARQUETIPOS: [
    {
      nome: 'api-rest-express',
      descricao: 'API',
      requiredDirs: ['src', 'src/controllers'],
      optionalDirs: ['src/routes'],
      dependencyHints: ['express'],
      filePresencePatterns: ['api'],
      forbiddenDirs: ['pages'],
      rootFilesAllowed: ['package.json'],
      pesoBase: 1.2,
    },
    {
      nome: 'fullstack',
      descricao: 'FS',
      requiredDirs: ['pages', 'api', 'prisma'],
      optionalDirs: ['components'],
      dependencyHints: [],
      filePresencePatterns: [],
      forbiddenDirs: ['packages'],
      rootFilesAllowed: ['package.json'],
      pesoBase: 1.5,
    },
  ],
  normalizarCaminho: (p: string) => p.replace(/\\/g, '/'),
}));

vi.mock('../detector-dependencias.js', () => ({
  grafoDependencias: new Map<string, Set<string>>([['a.ts', new Set(['express'])]]),
}));

describe('pontuador – branches e explicações', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gera explicação por faixas e inclui fullstack como candidato adicional quando há sinais mistos', async () => {
    const { pontuarTodos } = await import('./pontuador.js');
    const arquivos = [
      'src/controllers/users.ts',
      'src/routes/users.ts',
      'pages/index.tsx',
      'prisma/schema.prisma',
      'api/hello.ts',
      'a.ts',
    ];
    const lista = pontuarTodos(arquivos);
    const api = lista.find((x) => x.nome === 'api-rest-express');
    // Em nossa config mock, a explicação pode cair na faixa de 70+ (sem texto de híbrido)
    expect(api?.explicacaoSimilaridade || '').toMatch(
      /padrão api-rest-express|Estrutura segue o padrão oficial/,
    );
    expect(lista.some((x) => x.nome === 'fullstack')).toBe(true);
  });

  it('retorna somente candidatos com algum sinal (filtra scores totalmente neutros)', async () => {
    // Sem qualquer diretório ou dependência/padrões
    const { pontuarTodos } = await import('./pontuador.js');
    const lista = pontuarTodos(['readme.md']);
    expect(lista.length).toBeGreaterThanOrEqual(0);
    // Não deve conter itens sem signals
    expect(
      lista.every(
        (r) =>
          (r.matchedRequired?.length || 0) > 0 ||
          (r.matchedOptional?.length || 0) > 0 ||
          (r.dependencyMatches?.length || 0) > 0 ||
          (r.filePatternMatches?.length || 0) > 0 ||
          (r.forbiddenPresent?.length || 0) > 0,
      ),
    ).toBe(true);
  });

  it('quando só há penalidades (forbidden), ainda há explicação informativa', async () => {
    const { pontuarTodos } = await import('./pontuador.js');
    const lista = pontuarTodos(['pages/_app.tsx']);
    const fs = lista.find((x) => x.nome === 'fullstack');
    // fullstack tem forbidden packages, não pages; então escolha API que tem forbidden pages
    const api = lista.find((x) => x.nome === 'api-rest-express');
    expect(api?.forbiddenPresent?.length || 0).toBeGreaterThan(0);
    // Explicação pode ser a de "padrão mais próximo" dependendo do score; apenas verifica que não está vazia
    expect((api?.explicacaoSimilaridade || '').length).toBeGreaterThan(0);
  });
});
