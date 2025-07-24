import { grafoDependencias } from './detector-dependencias';
// Estado global que pode ser lido após execução
export const sinaisDetectados = {
    temPages: false,
    temApi: false,
    temExpress: false,
    temControllers: false,
    temComponents: false,
    temCli: false,
    temSrc: false,
    temPrisma: false,
    temPackages: false,
    ehFullstack: false,
    ehMonorepo: false
};
export const detectorEstrutura = {
    nome: 'detector-estrutura',
    global: true,
    aplicar: (src, relPath, ast, fullPath, contexto) => {
        if (!contexto)
            return [];
        const caminhos = contexto.arquivos.map(f => f.relPath);
        const sinais = {
            temPages: caminhos.some(p => p.includes('pages/')),
            temApi: caminhos.some(p => p.includes('api/')),
            temControllers: caminhos.some(p => p.includes('controllers/')),
            temComponents: caminhos.some(p => p.includes('components/')),
            temCli: caminhos.some(p => p.endsWith('/cli.ts') || p.endsWith('/cli.js')),
            temSrc: caminhos.some(p => p.includes('/src/')),
            temPrisma: caminhos.some(p => p.includes('prisma/') || p.includes('schema.prisma')),
            temPackages: caminhos.some(p => p.includes('packages/') || p.includes('turbo.json')),
            temExpress: grafoDependencias.has('express'),
            ehFullstack: false,
            ehMonorepo: false
        };
        sinais.ehFullstack = sinais.temPages && sinais.temApi && sinais.temPrisma;
        sinais.ehMonorepo = sinais.temPackages;
        Object.assign(sinaisDetectados, sinais);
        return [];
    }
};
