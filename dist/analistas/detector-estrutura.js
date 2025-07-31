import { grafoDependencias } from './detector-dependencias.js';
export const sinaisDetectados = {};
export const detectorEstrutura = {
    nome: 'detector-estrutura',
    global: true,
    test(_relPath) {
        // Global: tanto faz o arquivo; será rodado uma vez no final
        return true;
    },
    aplicar(_src, _relPath, _ast, _fullPath, contexto) {
        if (!contexto)
            return [];
        const caminhos = contexto.arquivos.map((f) => f.relPath);
        const sinais = {
            temPages: caminhos.some((p) => p.includes('pages/')),
            temApi: caminhos.some((p) => p.includes('api/')),
            temControllers: caminhos.some((p) => p.includes('controllers/')),
            temComponents: caminhos.some((p) => p.includes('components/')),
            temCli: caminhos.some((p) => p.endsWith('/cli.ts') || p.endsWith('/cli.js')),
            temSrc: caminhos.some((p) => p.includes('/src/')),
            temPrisma: caminhos.some((p) => p.includes('prisma/') || p.includes('schema.prisma')),
            temPackages: caminhos.some((p) => p.includes('packages/') || p.includes('turbo.json')),
            temExpress: grafoDependencias.has('express')
        };
        // Derivados
        const ehFullstack = !!(sinais.temPages && sinais.temApi && sinais.temPrisma);
        const ehMonorepo = !!sinais.temPackages;
        Object.assign(sinaisDetectados, sinais);
        // Se quiser gerar ocorrências com base nisso, pode adicionar aqui:
        const ocorrencias = [];
        if (ehMonorepo) {
            ocorrencias.push({
                tipo: 'estrutura-monorepo',
                nivel: 'info',
                mensagem: 'Estrutura de monorepo detectada.',
                origem: 'detector-estrutura'
            });
        }
        if (ehFullstack) {
            ocorrencias.push({
                tipo: 'estrutura-fullstack',
                nivel: 'info',
                mensagem: 'Estrutura fullstack detectada.',
                origem: 'detector-estrutura'
            });
        }
        return ocorrencias;
    }
};
