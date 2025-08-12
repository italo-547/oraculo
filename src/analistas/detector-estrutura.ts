import { grafoDependencias } from './detector-dependencias.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  TecnicaAplicarResultado,
  ContextoExecucao,
  Ocorrencia,
  SinaisProjeto,
} from '../tipos/tipos.js';

export const sinaisDetectados: SinaisProjeto = {};

/**
 * Analisa a estrutura do projeto e detecta padrões como monorepo, fullstack, mistura de src/packages, etc.
 * Retorna ocorrências para cada sinal relevante encontrado.
 */
export const detectorEstrutura = {
  nome: 'detector-estrutura',
  global: true,
  test(_relPath: string): boolean {
    return true;
  },

  async aplicar(
    _src: string,
    _relPath: string,
    _ast: unknown,
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): Promise<TecnicaAplicarResultado> {
    if (!contexto) return [];

    const caminhos = contexto.arquivos.map((f) => f.relPath);

    const sinais: SinaisProjeto & {
      ehFullstack?: boolean;
      ehMonorepo?: boolean;
    } = {
      temPages: caminhos.some((p) => p.includes('pages/')),
      temApi: caminhos.some((p) => p.includes('api/')),
      temControllers: caminhos.some((p) => p.includes('controllers/')),
      temComponents: caminhos.some((p) => p.includes('components/')),
      temCli: caminhos.some((p) => p.endsWith('/cli.ts') || p.endsWith('/cli.js')),
      temSrc: caminhos.some((p) => p.includes('/src/')),
      temPrisma: caminhos.some((p) => p.includes('prisma/') || p.includes('schema.prisma')),
      temPackages: caminhos.some((p) => p.includes('packages/') || p.includes('turbo.json')),
      temExpress: grafoDependencias.has('express'),
    };

    const ehFullstack = !!(sinais.temPages && sinais.temApi && sinais.temPrisma);
    const ehMonorepo = !!sinais.temPackages;

    Object.assign(sinaisDetectados, sinais);

    const ocorrencias: Ocorrencia[] = [];

    // Estrutura monorepo
    if (ehMonorepo) {
      ocorrencias.push({
        tipo: 'estrutura-monorepo',
        nivel: 'info',
        mensagem: 'Estrutura de monorepo detectada.',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
      // Monorepo sem packages
      if (!caminhos.some((p) => p.includes('packages/'))) {
        ocorrencias.push({
          tipo: 'estrutura-monorepo-incompleto',
          nivel: 'aviso',
          mensagem: 'Monorepo sem pasta packages/.',
          origem: 'detector-estrutura',
          relPath: '[raiz do projeto]',
          linha: 0,
        });
      }
    }

    // Estrutura fullstack
    if (ehFullstack) {
      ocorrencias.push({
        tipo: 'estrutura-fullstack',
        nivel: 'info',
        mensagem: 'Estrutura fullstack detectada.',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    } else if (sinais.temPages && !sinais.temApi) {
      ocorrencias.push({
        tipo: 'estrutura-incompleta',
        nivel: 'aviso',
        mensagem: 'Projeto possui pages/ mas não possui api/.',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    // Mistura de padrões: src/ e packages/ juntos
    if (sinais.temSrc && sinais.temPackages) {
      ocorrencias.push({
        tipo: 'estrutura-mista',
        nivel: 'aviso',
        mensagem:
          'Projeto possui src/ e packages/ (monorepo) ao mesmo tempo. Avalie a organização.',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

  // Muitos arquivos na raiz (considera apenas nível imediato sem subpastas)
  const arquivosRaiz = caminhos.filter((p) => !p.includes('/') && p.trim() !== '');
    if (arquivosRaiz.length > 10) {
      ocorrencias.push({
        tipo: 'estrutura-suspeita',
        nivel: 'aviso',
        mensagem: 'Muitos arquivos na raiz do projeto. Considere organizar em pastas.',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    // Sinais de backend
    if (sinais.temControllers || sinais.temPrisma || sinais.temApi) {
      ocorrencias.push({
        tipo: 'estrutura-backend',
        nivel: 'info',
        mensagem: 'Sinais de backend detectados (controllers/, prisma/, api/).',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    // Sinais de frontend
    if (sinais.temComponents || sinais.temPages) {
      ocorrencias.push({
        tipo: 'estrutura-frontend',
        nivel: 'info',
        mensagem: 'Sinais de frontend detectados (components/, pages/).',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    // Arquivos de configuração conhecidos
    const arquivosConfig = ['package.json', 'tsconfig.json', 'turbo.json', 'pnpm-workspace.yaml'];
    for (const cfg of arquivosConfig) {
      if (caminhos.includes(cfg)) {
        ocorrencias.push({
          tipo: 'estrutura-config',
          nivel: 'info',
          mensagem: `Arquivo de configuração detectado: ${cfg}`,
          origem: 'detector-estrutura',
          relPath: cfg,
          linha: 1,
        });
      }
    }

    // Múltiplos entrypoints
    const entrypoints = caminhos.filter((p) => /(^|\/)(cli|index|main)\.(ts|js)$/.test(p));
    if (entrypoints.length > 1) {
      ocorrencias.push({
        tipo: 'estrutura-entrypoints',
        nivel: 'aviso',
        mensagem: `Projeto possui múltiplos entrypoints: ${entrypoints.join(', ')}`,
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    // Ausência de src/ em projetos grandes (verifica realmente se diretório src existe fisicamente)
    if (!sinais.temSrc && caminhos.length > 30) {
      try {
        const raiz = contexto.baseDir || process.cwd();
        const srcPath = path.join(raiz, 'src');
  const statOk = await fs.stat(srcPath).catch(() => null as unknown as { isDirectory?: () => boolean } | null);
  if (!statOk || !statOk.isDirectory || !statOk.isDirectory()) {
          ocorrencias.push({
            tipo: 'estrutura-sem-src',
            nivel: 'aviso',
            mensagem: 'Projeto grande sem pasta src/. Considere organizar o código fonte.',
            origem: 'detector-estrutura',
            relPath: '[raiz do projeto]',
            linha: 0,
          });
        }
      } catch {
        // silencioso
      }
    }

    return Array.isArray(ocorrencias) ? ocorrencias : [];
  },
};
