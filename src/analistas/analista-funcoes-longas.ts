import { traverse } from '../nucleo/constelacao/traverse';
import config from '../nucleo/constelacao/cosmos';
const LIMITE_LINHAS = config.ZELADOR_LINE_THRESHOLD ?? 30;
export const analistaFuncoesLongas = {
    nome: 'analista-funcoes-longas',
    test: (relPath) => relPath.endsWith('.js') || relPath.endsWith('.ts'),
    global: false,
    aplicar: (src, relPath, ast, fullPath, contexto) => {
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
                    codigo: 'FUNCAO_LONGA',
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
        traverse(ast, {
            FunctionDeclaration(p) {
                analisar(p.node);
            },
            FunctionExpression(p) {
                analisar(p.node);
            },
            ArrowFunctionExpression(p) {
                analisar(p.node);
            }
        });
        return ocorrencias;
    }
};
