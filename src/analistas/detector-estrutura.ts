import { grafoDependencias } from './detector-dependencias.js';
import type {
  TecnicaAplicarResultado,
  ContextoExecucao,
  Ocorrencia,
  SinaisProjeto,
} from '../tipos/tipos.js';

export const sinaisDetectados: SinaisProjeto = {};

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

    if (ehMonorepo) {
      ocorrencias.push({
        tipo: 'estrutura-monorepo',
        nivel: 'info',
        mensagem: 'Estrutura de monorepo detectada.',
        origem: 'detector-estrutura',
      });
    }

    if (ehFullstack) {
      ocorrencias.push({
        tipo: 'estrutura-fullstack',
        nivel: 'info',
        mensagem: 'Estrutura fullstack detectada.',
        origem: 'detector-estrutura',
      });
    }

    return ocorrencias;
  },
};
