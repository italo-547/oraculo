import { traverse } from '../nucleo/constelacao/traverse.js';
import { config } from '../nucleo/constelacao/cosmos.js';
const LIMITE_LINHAS = config.ZELADOR_LINE_THRESHOLD ?? 30;
export const analistaFuncoesLongas = {
    nome: 'analista-funcoes-longas',
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    global: false,
    aplicar(src, relPath, ast, fullPath, contexto) {
        const ocorrencias = [];
        if (!ast)
            return [];
        function analisar(fn) {
            if (!fn.loc)
                return;
            const linhas = fn.loc.end.line - fn.loc.start.line + 1;
            if (linhas > LIMITE_LINHAS) {
                ocorrencias.push({
                    tipo: 'FUNCAO_LONGA',
                    severidade: 2,
                    nivel: 'aviso',
                    relPath,
                    arquivo: relPath,
                    linha: fn.loc.start.line,
                    mensagem: `Função com ${linhas} linhas (máx: ${LIMITE_LINHAS})`,
                    origem: 'analista-funcoes-longas'
                });
            }
        }
        traverse(ast.node, {
            FunctionDeclaration(path) {
                analisar(path.node);
            },
            FunctionExpression(path) {
                analisar(path.node);
            },
            ArrowFunctionExpression(path) {
                analisar(path.node);
            }
        });
        return ocorrencias;
    }
};
