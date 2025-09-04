import { detectarArquetipoNode } from '@analistas/detectores/detector-node.js';
import { detectarArquetipoJava } from '@analistas/detectores/detector-java.js';
import { detectarArquetipoKotlin } from '@analistas/detectores/detector-kotlin.js';
import { detectarArquetipoXML } from '@analistas/detectores/detector-xml.js';
import { pontuarTodos } from '@analistas/deteccao/pontuador.js';
import { ARQUETIPOS } from './arquetipos-defs.js';
/**
 * Orquestrador central de detecção de arquétipos
 * Agrega votos dos detectores especializados e decide o arquétipo final
 */
export function detectarArquetipo(arquivos) {
    // Agregação dos detectores por stack
    const candidatos = [
        ...detectarArquetipoNode(arquivos),
        ...detectarArquetipoJava(arquivos),
        ...detectarArquetipoKotlin(arquivos),
        ...detectarArquetipoXML(arquivos),
    ];
    let lista = candidatos;
    if (!lista.length) {
        // Fallback de compatibilidade: usar o pontuador completo para preservar comportamento legado
        lista = pontuarTodos(arquivos);
    }
    // Se ainda vazio, é desconhecido
    if (!lista.length) {
        return {
            nome: 'desconhecido',
            score: 0,
            confidence: 0,
            matchedRequired: [],
            missingRequired: [],
            matchedOptional: [],
            dependencyMatches: [],
            filePatternMatches: [],
            forbiddenPresent: [],
            anomalias: [],
            sugestaoPadronizacao: '',
            explicacaoSimilaridade: '',
            descricao: 'Arquétipo não identificado',
        };
    }
    // Regra especial (compatibilidade com testes de penalidades):
    // Se existir candidato cujo único "sinal" são diretórios proibidos presentes
    // (sem matches de required/optional/dependency/pattern), priorizamos aquele
    // com maior quantidade de diretórios proibidos detectados.
    const apenasPenalidades = lista.filter((c) => {
        const pos = (c.matchedRequired?.length || 0) +
            (c.matchedOptional?.length || 0) +
            (c.dependencyMatches?.length || 0) +
            (c.filePatternMatches?.length || 0);
        const forb = c.forbiddenPresent?.length || 0;
        return forb > 0 && pos === 0;
    });
    if (apenasPenalidades.length > 0) {
        // Heurística de segurança: ignore o candidato 'monorepo-packages' quando o único forbidden presente for 'src'
        // (cenário comum em projetos Node simples com pasta src/, que não devem ser classificados como monorepo).
        const filtrados = apenasPenalidades.filter((c) => {
            // Regra específica: se o candidato for 'monorepo-packages' e o único forbidden detectado for 'src', descartamos
            if (c.nome === 'monorepo-packages') {
                const forb = c.forbiddenPresent || [];
                if (forb.length === 1 && forb[0] === 'src')
                    return false;
            }
            return true;
        });
        if (filtrados.length === 0) {
            // caso todos tenham sido filtrados, prossegue com fluxo normal
        }
        else {
            // desempate refinado: maior cobertura relativa de forbidden (detectados/definidos)
            filtrados.sort((a, b) => {
                const forbA = a.forbiddenPresent?.length || 0;
                const forbB = b.forbiddenPresent?.length || 0;
                // Usa somente o total de diretórios proibidos definidos no alvo para o ratio
                const defA = ARQUETIPOS.find((d) => d.nome === a.nome);
                const defB = ARQUETIPOS.find((d) => d.nome === b.nome);
                const totA = defA?.forbiddenDirs?.length || 0;
                const totB = defB?.forbiddenDirs?.length || 0;
                const ratioA = totA > 0 ? forbA / totA : 0;
                const ratioB = totB > 0 ? forbB / totB : 0;
                if (ratioB !== ratioA)
                    return ratioB - ratioA;
                if (forbB !== forbA)
                    return forbB - forbA;
                // depois, mais missingRequired primeiro (penalidade maior do alvo)
                const miss = (b.missingRequired?.length || 0) - (a.missingRequired?.length || 0);
                if (miss !== 0)
                    return miss;
                return a.nome.localeCompare(b.nome);
            });
            return filtrados[0];
        }
    }
    // Ordenação próxima do legado: menor missingRequired, maior score, maior matchedRequired, maior confidence, nome asc
    lista.sort((a, b) => {
        const mm = (a.missingRequired?.length || 0) - (b.missingRequired?.length || 0);
        if (mm !== 0)
            return mm;
        if (b.score !== a.score)
            return b.score - a.score;
        const mr = (b.matchedRequired?.length || 0) - (a.matchedRequired?.length || 0);
        if (mr !== 0)
            return mr;
        if (b.confidence !== a.confidence)
            return b.confidence - a.confidence;
        return a.nome.localeCompare(b.nome);
    });
    const best = lista[0];
    const hasSignals = (best.matchedRequired?.length || 0) > 0 ||
        (best.matchedOptional?.length || 0) > 0 ||
        (best.dependencyMatches?.length || 0) > 0 ||
        (best.filePatternMatches?.length || 0) > 0 ||
        (best.forbiddenPresent?.length || 0) > 0;
    if (!hasSignals) {
        return {
            nome: 'desconhecido',
            score: 0,
            confidence: 0,
            matchedRequired: [],
            missingRequired: [],
            matchedOptional: [],
            dependencyMatches: [],
            filePatternMatches: [],
            forbiddenPresent: [],
            anomalias: [],
            sugestaoPadronizacao: '',
            explicacaoSimilaridade: '',
            descricao: 'Arquétipo não identificado',
        };
    }
    return best;
}
//# sourceMappingURL=orquestrador-arquetipos.js.map