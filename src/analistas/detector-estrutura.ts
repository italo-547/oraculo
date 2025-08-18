// SPDX-License-Identifier: MIT
import { grafoDependencias } from './detector-dependencias.js';
import micromatch from 'micromatch';
import { config } from '../nucleo/constelacao/cosmos.js';
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

  aplicar(
    _src: string,
    _relPath: string,
    _ast: unknown,
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado {
    if (!contexto) return [];

    const caminhos = contexto.arquivos.map((f) => f.relPath);
    // Normaliza separadores para evitar falsos negativos em Windows (\\ vs /)
    const caminhosNorm = caminhos.map((p) => p.replace(/\\/g, '/'));

    const sinais: SinaisProjeto & {
      ehFullstack?: boolean;
      ehMonorepo?: boolean;
    } = {
      temPages: caminhosNorm.some((p) => p.includes('pages/')),
      temApi: caminhosNorm.some((p) => p.includes('api/')),
      temControllers: caminhosNorm.some((p) => p.includes('controllers/')),
      temComponents: caminhosNorm.some((p) => p.includes('components/')),
      temCli: caminhosNorm.some((p) => /(^|\/)cli\.(ts|js)$/.test(p)),
      temSrc: caminhosNorm.some((p) => p.startsWith('src/') || p.includes('/src/')),
      temPrisma: caminhosNorm.some((p) => p.includes('prisma/') || p.includes('schema.prisma')),
      temPackages: caminhosNorm.some((p) => p.includes('packages/') || p.includes('turbo.json')),
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
    const arquivosRaiz = caminhosNorm.filter((p) => !p.includes('/') && p.trim() !== '');
    const LIMITE_RAIZ = Number(config.ESTRUTURA_ARQUIVOS_RAIZ_MAX || 10);
    if (arquivosRaiz.length > LIMITE_RAIZ) {
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
    // Lista de entrypoints potencialmente grande em repositórios com dependências; filtra ignorados
    const entrypointsAll = caminhosNorm.filter((p) =>
      /(^|[\\/])(cli|index|main)\.(ts|js)$/.test(p),
    );
    const ignored = Array.isArray(config.ZELADOR_IGNORE_PATTERNS)
      ? (config.ZELADOR_IGNORE_PATTERNS as string[])
      : [];
    const entrypoints = entrypointsAll.filter((p) => !micromatch.isMatch(p, ignored));
    if (entrypoints.length > 1) {
      // Evita mensagens gigantes: limita a uma prévia e indica quantidade oculta
      const MAX_LIST = 20;
      const preview = entrypoints.slice(0, MAX_LIST);
      const resto = entrypoints.length - preview.length;
      ocorrencias.push({
        tipo: 'estrutura-entrypoints',
        nivel: 'aviso',
        mensagem:
          resto > 0
            ? `Projeto possui múltiplos entrypoints: ${preview.join(', ')} … (+${resto} ocultos)`
            : `Projeto possui múltiplos entrypoints: ${preview.join(', ')}`,
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    // Ausência de src/ em projetos grandes (verifica realmente se diretório src existe fisicamente)
    if (!sinais.temSrc && caminhosNorm.length > 30) {
      ocorrencias.push({
        tipo: 'estrutura-sem-src',
        nivel: 'aviso',
        mensagem: 'Projeto grande sem pasta src/. Considere organizar o código fonte.',
        origem: 'detector-estrutura',
        relPath: '[raiz do projeto]',
        linha: 0,
      });
    }

    return Array.isArray(ocorrencias) ? ocorrencias : [];
  },
};
