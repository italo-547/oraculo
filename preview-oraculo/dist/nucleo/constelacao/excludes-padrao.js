// SPDX-License-Identifier: MIT
/**
 * Configuração centralizada dos padrões de exclusão do Oráculo
 *
 * Esta configuração define os padrões padrão de exclusão usados pelo sistema
 * de análise quando nenhum outro filtro é especificado.
 *
 * Precedência de configuração:
 * 1. Flags --include/--exclude (mais alta prioridade)
 * 2. oraculo.config.json (configuração do projeto)
 * 3. Este arquivo (padrões do sistema)
 * 4. Fallback hardcoded (mais baixa prioridade)
 */
/**
 * Configuração padrão dos padrões de exclusão
 *
 * Estes são os padrões recomendados pelo Oráculo para diferentes tipos de projeto.
 * Eles podem ser sobrescritos pelo usuário via oraculo.config.json
 */
export const EXCLUDES_PADRAO = {
    padroesSistema: [
        'node_modules',
        '**/node_modules/**',
        'dist/**',
        '**/dist/**',
        'build/**',
        '**/build/**',
        '**/*.log',
        '**/*.lock',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '**/.git/**',
        '.pnpm/**',
        '**/.oraculo/**',
        'preview-oraculo/**',
        'tests/fixtures/**',
    ],
    nodeJs: [
        'node_modules/**',
        '**/node_modules/**',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '.npm',
        '.yarn',
        'coverage/**',
        '**/coverage/**',
        '.nyc_output',
        'dist/**',
        '**/dist/**',
        'build/**',
        '**/build/**',
    ],
    typeScript: [
        'dist/**',
        '**/dist/**',
        'build/**',
        '**/build/**',
        '*.tsbuildinfo',
        '**/*.tsbuildinfo',
        '.tsbuildinfo',
        'out/**',
        '**/out/**',
    ],
    python: [
        '__pycache__/**',
        '**/__pycache__/**',
        '*.pyc',
        '**/*.pyc',
        '*.pyo',
        '**/*.pyo',
        '*.pyd',
        '**/*.pyd',
        '.Python',
        'env/**',
        'venv/**',
        '.env/**',
        'pip-log.txt',
        'pip-delete-this-directory.txt',
        '.tox/**',
        '.coverage',
        'htmlcov/**',
        '.pytest_cache/**',
        '.mypy_cache/**',
    ],
    java: [
        'target/**',
        '**/target/**',
        'build/**',
        '**/build/**',
        '*.class',
        '**/*.class',
        '*.jar',
        '**/*.jar',
        '*.war',
        '**/*.war',
        '*.ear',
        '**/*.ear',
        '.gradle/**',
        'gradle-app.setting',
        '!gradle-wrapper.jar',
        '.idea/**',
        '*.iml',
        '**/*.iml',
    ],
    dotnet: [
        'bin/**',
        '**/bin/**',
        'obj/**',
        '**/obj/**',
        '*.dll',
        '**/*.dll',
        '*.exe',
        '**/*.exe',
        '*.pdb',
        '**/*.pdb',
        '.vs/**',
        '**/.vs/**',
        '*.user',
        '**/*.user',
        '*.suo',
        '**/*.suo',
        '*.cache',
        '**/*.cache',
    ],
    ferramentasDev: [
        '.vscode/**',
        '.idea/**',
        '*.swp',
        '**/*.swp',
        '*.swo',
        '**/*.swo',
        '*~',
        '**/*~',
        '.DS_Store',
        '**/.DS_Store',
        'Thumbs.db',
        '**/Thumbs.db',
    ],
    controleVersao: [
        '.git/**',
        '**/.git/**',
        '.svn/**',
        '**/.svn/**',
        '.hg/**',
        '**/.hg/**',
        '.bzr/**',
        '**/.bzr/**',
    ],
    temporarios: [
        '*.tmp',
        '**/*.tmp',
        '*.temp',
        '**/*.temp',
        '*.bak',
        '**/*.bak',
        '.tmp/**',
        '**/.tmp/**',
        'tmp/**',
        '**/tmp/**',
        'temp/**',
        '**/temp/**',
    ],
    documentacao: [
        'docs/**',
        '**/docs/**',
        '*.md',
        '**/*.md',
        'README*',
        '**/README*',
        'CHANGELOG*',
        '**/CHANGELOG*',
        'LICENSE*',
        '**/LICENSE*',
    ],
    metadata: {
        versao: '1.0.0',
        ultimaAtualizacao: '2025-08-29',
        descricao: 'Configuração padrão dos padrões de exclusão do Oráculo',
    },
};
/**
 * Função para obter os padrões de exclusão recomendados baseado no tipo de projeto
 *
 * @param tipoProjeto Tipo de projeto detectado ou 'generico' para padrões gerais
 * @returns Array de padrões de exclusão recomendados
 */
export function getExcludesRecomendados(tipoProjeto = 'generico') {
    const base = [...EXCLUDES_PADRAO.padroesSistema];
    switch (tipoProjeto.toLowerCase()) {
        case 'nodejs':
        case 'javascript':
        case 'typescript':
            return [...base, ...EXCLUDES_PADRAO.nodeJs, ...EXCLUDES_PADRAO.typeScript];
        case 'python':
            return [...base, ...EXCLUDES_PADRAO.python];
        case 'java':
        case 'kotlin':
            return [...base, ...EXCLUDES_PADRAO.java];
        case 'dotnet':
        case 'csharp':
        case 'c#':
            return [...base, ...EXCLUDES_PADRAO.dotnet];
        case 'generico':
        default:
            return [
                ...base,
                ...EXCLUDES_PADRAO.ferramentasDev,
                ...EXCLUDES_PADRAO.controleVersao,
                ...EXCLUDES_PADRAO.temporarios,
            ];
    }
}
/**
 * Função para validar se um padrão de exclusão é seguro
 *
 * @param padrao Padrão a ser validado
 * @returns true se o padrão é considerado seguro
 */
export function isPadraoExclusaoSeguro(padrao) {
    const padroesPerigosos = [
        '**/*', // Exclui tudo
        '*', // Exclui tudo no nível atual
        '*/**/*', // Exclui tudo recursivamente
        '**', // Exclui tudo
        '', // Padrão vazio
    ];
    // Verifica se o padrão contém caracteres perigosos
    if (padroesPerigosos.includes(padrao.trim())) {
        return false;
    }
    // Verifica se o padrão é muito genérico (muitos asteriscos consecutivos)
    if (padrao.includes('***') || padrao.includes('****')) {
        return false;
    }
    return true;
}
/**
 * Função para mesclar configurações de exclusão com precedência
 *
 * Precedência (do mais alto para o mais baixo):
 * 1. Configuração do usuário via oraculo.config.json
 * 2. Padrões recomendados baseados no tipo de projeto
 * 3. Padrões do sistema
 *
 * @param configUsuario Configuração do usuário (pode ser null/undefined)
 * @param tipoProjeto Tipo de projeto para padrões recomendados
 * @returns Array consolidado de padrões de exclusão
 */
export function mesclarConfigExcludes(configUsuario, tipoProjeto = 'generico') {
    // Se o usuário definiu configuração própria, usa ela
    if (configUsuario && Array.isArray(configUsuario) && configUsuario.length > 0) {
        // Valida os padrões do usuário
        const padroesValidos = configUsuario.filter(isPadraoExclusaoSeguro);
        if (padroesValidos.length !== configUsuario.length) {
            console.warn(`⚠️ Alguns padrões de exclusão foram considerados inseguros e foram ignorados: ${configUsuario
                .filter((p) => !isPadraoExclusaoSeguro(p))
                .join(', ')}`);
        }
        return Array.from(new Set(padroesValidos));
    }
    // Caso contrário, usa os padrões recomendados
    return getExcludesRecomendados(tipoProjeto);
}
//# sourceMappingURL=excludes-padrao.js.map