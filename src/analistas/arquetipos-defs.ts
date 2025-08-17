import type { ArquetipoEstruturaDef } from '../tipos/tipos.js';

export const ARQUETIPOS: ArquetipoEstruturaDef[] = [
  {
    nome: 'cli-modular',
    descricao: 'CLI modular em TypeScript com entrada em src/cli.ts ou cli.ts na raiz',
    requiredDirs: ['src'],
    optionalDirs: ['src/cli', 'src/cli/commands'],
    filePresencePatterns: ['cli.ts'],
    dependencyHints: ['commander'],
    rootFilesAllowed: [
      'package.json',
      'tsconfig.json',
      'README.md',
      '.gitignore',
      '.prettierrc',
      'eslint.config.js',
      '.lintstagedrc.cjs',
      '.lintstagedrc.mjs',
      'LICENSE',
    ],
    // Evita colisão desnecessária com monorepo; penaliza apenas sinais de frontend típicos
    forbiddenDirs: ['pages', 'prisma'],
    pesoBase: 1,
  },
  {
    nome: 'landing-page',
    descricao: 'Aplicação web (frontend) com pages/ e components/',
    requiredDirs: ['pages'],
    optionalDirs: ['components', 'public'],
    forbiddenDirs: ['prisma'],
    rootFilesAllowed: ['package.json', 'tsconfig.json', 'README.md'],
    pesoBase: 1,
  },
  {
    nome: 'api-rest-express',
    descricao: 'API REST em Express com controllers/',
    requiredDirs: ['src', 'src/controllers'],
    optionalDirs: ['src/routes', 'src/middlewares'],
    dependencyHints: ['express'],
    forbiddenDirs: ['pages'],
    rootFilesAllowed: ['package.json', 'tsconfig.json', '.env.example'],
    pesoBase: 1.2,
  },
  {
    nome: 'fullstack',
    descricao: 'Aplicação fullstack (pages/ + api/ + prisma/)',
    requiredDirs: ['pages', 'api', 'prisma'],
    optionalDirs: ['components', 'lib'],
    // Em projetos fullstack, normalmente não coexistem workspaces/packages na raiz
    // pois indicam estrutura de monorepo; penalizamos quando presente.
    forbiddenDirs: ['packages'],
    dependencyHints: [],
    rootFilesAllowed: ['package.json', 'tsconfig.json'],
    pesoBase: 1.5,
  },
  {
    nome: 'bot',
    descricao: 'Bot (ex: discord/telegram) com src/bot ou bot.ts',
    requiredDirs: ['src'],
    filePresencePatterns: ['bot.ts', 'src/bot'],
    dependencyHints: ['telegraf', 'discord.js'],
    rootFilesAllowed: ['package.json', 'tsconfig.json'],
    // Estruturas típicas de frontend/monorepo não são esperadas em bots
    forbiddenDirs: ['pages', 'prisma', 'packages', 'electron-app'],
    pesoBase: 0.9,
  },
  {
    nome: 'electron',
    descricao: 'Aplicação Electron com main process',
    requiredDirs: ['src'],
    filePresencePatterns: ['electron.js', 'main.js', 'electron.ts'],
    dependencyHints: ['electron'],
    rootFilesAllowed: ['package.json', 'tsconfig.json'],
    // Electron não deve coexistir com pastas típicas de fullstack/monorepo
    forbiddenDirs: ['pages', 'prisma', 'packages'],
    pesoBase: 1.1,
  },
  {
    nome: 'lib-tsc',
    descricao: 'Biblioteca TypeScript compilada via tsc',
    requiredDirs: ['src'],
    optionalDirs: ['src/lib', 'src/utils'],
    // Evita colisão com projeto mínimo contendo apenas index.ts na raiz
    filePresencePatterns: ['src/index.ts'],
    dependencyHints: [],
    rootFilesAllowed: ['package.json', 'tsconfig.json', 'README.md'],
    forbiddenDirs: ['pages', 'api', 'prisma'],
    pesoBase: 1,
  },
  {
    nome: 'monorepo-packages',
    descricao: 'Monorepo com packages/ e workspaces',
    requiredDirs: ['packages'],
    optionalDirs: ['apps', 'packages/*'],
    dependencyHints: [],
    rootFilesAllowed: ['package.json', 'tsconfig.json', 'turbo.json', 'pnpm-workspace.yaml'],
    // Penaliza estrutura de código na raiz em monorepos (esperado ficar em apps/ ou packages/)
    forbiddenDirs: ['src', 'pages', 'api', 'prisma'],
    pesoBase: 1.4,
  },
];

export function normalizarCaminho(p: string): string {
  return p.replace(/\\/g, '/');
}
