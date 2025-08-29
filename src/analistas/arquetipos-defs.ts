// SPDX-License-Identifier: MIT
import type { ArquetipoEstruturaDef } from '../tipos/tipos.js';

export const ARQUETIPOS: ArquetipoEstruturaDef[] = [
  {
    nome: 'cli-modular',
    descricao: 'CLI modular em TypeScript com entrada em src/cli.ts ou cli.ts na raiz',
    requiredDirs: ['src/cli'],
    optionalDirs: ['src/cli/commands', 'src/utils', 'src/lib'],
    filePresencePatterns: ['cli.ts', 'bin/cli'],
    dependencyHints: ['commander', 'yargs', 'chalk'],
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
      'CHANGELOG.md',
    ],
    // Evita colisão desnecessária com monorepo; penaliza apenas sinais de frontend típicos
    forbiddenDirs: ['pages', 'prisma', 'public'],
    pesoBase: 1.1, // Aumentado para dar mais peso a CLIs estruturadas
  },
  {
    nome: 'landing-page',
    descricao: 'Aplicação web simples (frontend) com pages/ e components/',
    requiredDirs: ['pages', 'components'],
    optionalDirs: ['public', 'styles', 'utils'],
    forbiddenDirs: ['prisma', 'api', 'server'],
    rootFilesAllowed: [
      'package.json',
      'tsconfig.json',
      'README.md',
      'next.config.js',
      'tailwind.config.js',
    ],
    pesoBase: 1.0, // Mantido neutro
  },
  {
    nome: 'api-rest-express',
    descricao: 'API REST em Express com controllers/ e estrutura backend',
    requiredDirs: ['src', 'src/controllers'],
    optionalDirs: ['src/routes', 'src/middlewares', 'src/models', 'src/services'],
    dependencyHints: ['express', 'cors', 'helmet', 'joi', 'joi-to-swagger'],
    forbiddenDirs: ['pages', 'components', 'public'],
    rootFilesAllowed: ['package.json', 'tsconfig.json', '.env.example', 'README.md', 'server.js'],
    pesoBase: 1.3, // Aumentado pois é um padrão muito específico e maduro
  },
  {
    nome: 'fullstack',
    descricao: 'Aplicação fullstack (Next.js) com pages/, api/ e prisma/',
    requiredDirs: ['pages', 'api', 'prisma'],
    optionalDirs: ['components', 'lib', 'styles', 'utils', 'types'],
    // Em projetos fullstack, normalmente não coexistem workspaces/packages na raiz
    // pois indicam estrutura de monorepo; penalizamos quando presente.
    forbiddenDirs: ['packages', 'apps', 'server'],
    dependencyHints: ['next', 'react', 'prisma'],
    rootFilesAllowed: ['package.json', 'tsconfig.json', 'next.config.js', 'tailwind.config.js'],
    pesoBase: 1.4, // Aumentado pois combina frontend + backend + banco
  },
  {
    nome: 'bot',
    descricao: 'Bot (Discord/Telegram) com estrutura simples e handlers',
    requiredDirs: ['src/bot'],
    optionalDirs: ['src/commands', 'src/events', 'src/utils'],
    filePresencePatterns: ['bot.ts', 'bot.js', 'index.ts'],
    dependencyHints: ['telegraf', 'discord.js', 'grammy'],
    rootFilesAllowed: ['package.json', 'tsconfig.json', 'README.md', '.env.example'],
    // Estruturas típicas de frontend/monorepo não são esperadas em bots
    forbiddenDirs: ['pages', 'prisma', 'packages', 'electron-app', 'public'],
    pesoBase: 0.9, // Mantido baixo pois é mais simples
  },
  {
    nome: 'electron',
    descricao: 'Aplicação Electron com main process e renderer',
    requiredDirs: ['src', 'src/main'],
    optionalDirs: ['src/renderer', 'src/preload', 'public'],
    filePresencePatterns: ['electron.js', 'electron.ts', 'main.js'],
    dependencyHints: ['electron', 'electron-builder'],
    rootFilesAllowed: ['package.json', 'tsconfig.json', 'README.md', 'electron-builder.json'],
    // Electron não deve coexistir com pastas típicas de web fullstack/monorepo
    forbiddenDirs: ['pages', 'prisma', 'packages', 'api'],
    pesoBase: 1.2, // Aumentado pois tem estrutura específica
  },
  {
    nome: 'lib-tsc',
    descricao: 'Biblioteca TypeScript compilada com estrutura organizada',
    requiredDirs: ['src', 'src/index.ts'],
    optionalDirs: ['src/lib', 'src/utils', 'src/types', 'examples'],
    filePresencePatterns: ['index.ts', 'lib/index.ts'],
    dependencyHints: [], // Bibliotecas geralmente têm poucas deps de runtime
    rootFilesAllowed: [
      'package.json',
      'tsconfig.json',
      'README.md',
      'LICENSE',
      'rollup.config.js',
      'webpack.config.js',
    ],
    forbiddenDirs: ['pages', 'api', 'prisma', 'public', 'server'],
    pesoBase: 1.0, // Mantido neutro
  },
  {
    nome: 'monorepo-packages',
    descricao: 'Monorepo com packages/ e workspaces (pnpm/npm/yarn)',
    requiredDirs: ['packages'],
    optionalDirs: ['apps', 'tools', 'packages/shared', 'packages/core'],
    dependencyHints: [],
    rootFilesAllowed: [
      'package.json',
      'tsconfig.json',
      'turbo.json',
      'pnpm-workspace.yaml',
      'yarn.lock',
      'pnpm-lock.yaml',
    ],
    // Penaliza estrutura de código na raiz em monorepos (esperado ficar em apps/ ou packages/)
    forbiddenDirs: ['src', 'pages', 'api', 'prisma', 'lib'],
    pesoBase: 1.5, // Aumentado pois é uma arquitetura mais complexa
  },
];

export function normalizarCaminho(p: string): string {
  return p.replace(/\\/g, '/');
}
