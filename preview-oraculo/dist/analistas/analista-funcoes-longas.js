import { criarAnalista } from '../tipos/tipos.js';
import { config } from '../nucleo/constelacao/cosmos.js';
const LIMITE_LINHAS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_LINHAS ?? 30;
const LIMITE_PARAMETROS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_PARAMETROS ?? 4;
const LIMITE_ANINHAMENTO = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_ANINHAMENTO ?? 3;
export const analistaFuncoesLongas = criarAnalista({
    aplicar: function (src, relPath, ast, _fullPath) {
        const ocorrencias = [];
        function analisar(fn, _aninhamento = 0) {
            if (!fn.loc ||
                typeof fn.loc.start !== 'object' ||
                typeof fn.loc.end !== 'object' ||
                typeof fn.loc.start.line !== 'number' ||
                typeof fn.loc.end.line !== 'number' ||
                fn.loc.start.line < 1 ||
                fn.loc.end.line < fn.loc.start.line) {
                return;
            }
            const startLine = fn.loc.start.line;
            const endLine = fn.loc.end.line;
            const linhas = endLine - startLine + 1;
            if (linhas > LIMITE_LINHAS) {
                ocorrencias.push({
                    tipo: 'FUNCAO_LONGA',
                    severidade: 2,
                    nivel: 'aviso',
                    relPath,
                    arquivo: relPath,
                    linha: startLine,
                    mensagem: `Função com ${linhas} linhas (máx: ${LIMITE_LINHAS})`,
                    origem: 'analista-funcoes-longas',
                });
            }
            if (fn.params && Array.isArray(fn.params) && fn.params.length > LIMITE_PARAMETROS) {
                ocorrencias.push({
                    tipo: 'MUITOS_PARAMETROS',
                    severidade: 1,
                    nivel: 'aviso',
                    relPath,
                    arquivo: relPath,
                    linha: startLine,
                    mensagem: `Função com muitos parâmetros (${fn.params.length}, máx: ${LIMITE_PARAMETROS})`,
                    origem: 'analista-funcoes-longas',
                });
            }
            // Verifica se a função está aninhada demais
            if (_aninhamento > LIMITE_ANINHAMENTO) {
                ocorrencias.push({
                    tipo: 'FUNCAO_ANINHADA',
                    severidade: 1,
                    nivel: 'aviso',
                    relPath,
                    arquivo: relPath,
                    linha: startLine,
                    mensagem: `Função aninhada em nível ${_aninhamento} (máx: ${LIMITE_ANINHAMENTO})`,
                    origem: 'analista-funcoes-longas',
                });
            }
            // Verifica se a função não tem comentário imediatamente acima
            if (fn.leadingComments == null || fn.leadingComments.length === 0) {
                ocorrencias.push({
                    tipo: 'FUNCAO_SEM_COMENTARIO',
                    severidade: 1,
                    nivel: 'info',
                    relPath,
                    arquivo: relPath,
                    linha: startLine,
                    mensagem: `Função sem comentário acima.`,
                    origem: 'analista-funcoes-longas',
                });
            }
        }
        function analisarRecursivo(path, aninhamento = 0) {
            const node = 'node' in path ? path.node : path;
            const type = node.type;
            if (type === 'FunctionDeclaration' ||
                type === 'FunctionExpression' ||
                type === 'ArrowFunctionExpression') {
                analisar(node, aninhamento);
                aninhamento++;
            }
            if (typeof path.traverse === 'function') {
                path.traverse({
                    FunctionDeclaration(p) {
                        analisarRecursivo(p, aninhamento + 1);
                    },
                    FunctionExpression(p) {
                        analisarRecursivo(p, aninhamento + 1);
                    },
                    ArrowFunctionExpression(p) {
                        analisarRecursivo(p, aninhamento + 1);
                    },
                });
            }
        }
        // --- Fluxo centralizado e robusto ---
        // 1. NodePath real: use traverse e recursão
        if (ast && typeof ast.traverse === 'function') {
            analisarRecursivo(ast, 0);
            return ocorrencias;
        }
        // 2. AST puro ou mock: só processa body do File, nunca recursiona
        const fileNode = ast &&
            typeof ast === 'object' &&
            'node' in ast &&
            ast.node &&
            ast.node.type === 'File' &&
            Array.isArray(ast.node.body)
            ? ast.node
            : ast &&
                typeof ast === 'object' &&
                ast.type === 'File' &&
                Array.isArray(ast.body)
                ? ast
                : null;
        if (fileNode) {
            const body = fileNode.body;
            for (const child of body) {
                if (typeof child === 'object' &&
                    child !== null &&
                    (child.type === 'FunctionDeclaration' ||
                        child.type === 'FunctionExpression' ||
                        child.type === 'ArrowFunctionExpression')) {
                    analisar(child, 0);
                }
            }
            return ocorrencias;
        }
        // Se não for nenhum dos casos acima, retorna vazio
        return ocorrencias;
    },
    nome: 'analista-funcoes-longas',
    categoria: 'complexidade',
    descricao: 'Detecta funcoes muito longas, com muitos parametros, aninhamento excessivo ou sem comentario',
    limites: {
        linhas: LIMITE_LINHAS,
        params: LIMITE_PARAMETROS,
        aninhamento: LIMITE_ANINHAMENTO,
    },
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    global: false,
});
//# sourceMappingURL=analista-funcoes-longas.js.map