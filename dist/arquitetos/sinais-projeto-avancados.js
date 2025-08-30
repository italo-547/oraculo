// Exemplo de uso (remova ou adapte conforme necessário no contexto real)
export function scoreArquetipo(def, _arquivos, // prefixo _ para ignorar warning de unused
_sinaisAvancados) {
    // Implementação fictícia para evitar erro de compilação
    return {
        nome: def.nome,
        descricao: def.descricao ?? '',
        score: 0,
        confidence: 0,
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
    };
}
export function extrairSinaisAvancados(fileEntries, packageJson, _p0, _baseDir, _arquivos) {
    // Auxiliar para checar se o nó possui id.name string
    const hasIdName = (node) => {
        return (typeof node === 'object' &&
            node !== null &&
            'id' in node &&
            typeof node.id?.name === 'string');
    };
    const sinais = {
        funcoes: 0,
        imports: [],
        variaveis: 0,
        tipos: [],
        classes: 0,
        frameworksDetectados: [],
        dependencias: [],
        scripts: [],
        pastasPadrao: [],
        arquivosPadrao: [],
        arquivosConfig: [],
    };
    for (const fe of fileEntries) {
        let body = [];
        if (fe.ast &&
            fe.ast.node &&
            fe.ast.node.type === 'Program' &&
            Array.isArray(fe.ast.node.body)) {
            body = fe.ast.node.body;
        }
        // Funções
        sinais.funcoes += body.filter((n) => n.type === 'FunctionDeclaration').length;
        // Imports
        const imports = body.filter((n) => n.type === 'ImportDeclaration');
        sinais.imports.push(...imports.map((i) => i.source.value));
        // Variáveis
        sinais.variaveis += body.filter((n) => n.type === 'VariableDeclaration').length;
        // Tipos (TypeScript)
        sinais.tipos.push(...body
            .filter((n) => ['TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSEnumDeclaration'].includes(n.type))
            .map((n) => (hasIdName(n) ? n.id.name : undefined))
            .filter((v) => typeof v === 'string'));
        // Classes
        sinais.classes += body.filter((n) => n.type === 'ClassDeclaration').length;
        // Frameworks por import
        for (const i of imports) {
            if (typeof i.source.value === 'string') {
                if (/express|react|next|electron|discord\.js|telegraf/.test(i.source.value)) {
                    sinais.frameworksDetectados.push(i.source.value);
                }
            }
        }
        // Padrões de pastas/arquivos
        const rel = fe.relPath.replace(/\\/g, '/');
        if (/src\/controllers|pages|api|prisma|packages|apps/.test(rel)) {
            sinais.pastasPadrao.push(rel);
        }
        if (/main\.js|index\.ts|bot\.ts|electron\.js/.test(rel)) {
            sinais.arquivosPadrao.push(rel);
        }
        if (/tsconfig\.json|turbo\.json|pnpm-workspace\.yaml/.test(rel)) {
            sinais.arquivosConfig.push(rel);
        }
    }
    // Dependências e scripts do package.json
    if (packageJson) {
        sinais.dependencias.push(...Object.keys(packageJson.dependencies || {}));
        sinais.scripts.push(...Object.keys(packageJson.scripts || {}));
    }
    // Normaliza arrays
    sinais.imports = Array.from(new Set(sinais.imports));
    sinais.frameworksDetectados = Array.from(new Set(sinais.frameworksDetectados));
    sinais.pastasPadrao = Array.from(new Set(sinais.pastasPadrao));
    sinais.arquivosPadrao = Array.from(new Set(sinais.arquivosPadrao));
    sinais.arquivosConfig = Array.from(new Set(sinais.arquivosConfig));
    sinais.tipos = Array.from(new Set(sinais.tipos));
    return sinais;
}
//# sourceMappingURL=sinais-projeto-avancados.js.map