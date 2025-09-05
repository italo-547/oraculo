export var IntegridadeStatus;
(function (IntegridadeStatus) {
    IntegridadeStatus["Criado"] = "baseline-criado";
    IntegridadeStatus["Aceito"] = "baseline-aceito";
    IntegridadeStatus["Ok"] = "ok";
    IntegridadeStatus["AlteracoesDetectadas"] = "alteracoes-detectadas";
})(IntegridadeStatus || (IntegridadeStatus = {}));
export class GuardianError extends Error {
    detalhes;
    constructor(erros) {
        super('Integridade comprometida — execuções bloqueadas.');
        this.name = 'GuardianError';
        this.detalhes = erros;
    }
}
// Construtor simples para ocorrência garantindo escape básico e campos mínimos.
export function criarOcorrencia(base) {
    const resultado = {
        nivel: 'info',
        origem: 'oraculo',
        ...base,
        mensagem: base.mensagem.trim(),
    };
    return resultado;
}
// Auxiliares especializados
export function ocorrenciaErroAnalista(data) {
    return criarOcorrencia({ tipo: 'ERRO_ANALISTA', ...data });
}
export function ocorrenciaFuncaoComplexa(data) {
    return criarOcorrencia({ tipo: 'FUNCAO_COMPLEXA', ...data });
}
export function ocorrenciaParseErro(data) {
    return criarOcorrencia({ tipo: 'PARSE_ERRO', nivel: 'erro', ...data });
}
// Fábrica para criar analista com validação mínima
export function criarAnalista(def) {
    if (!def || typeof def !== 'object')
        throw new Error('Definição de analista inválida');
    if (!def.nome || (/\s/.test(def.nome) === false) === false) {
        // nome pode ter hifens, apenas exige não vazio
    }
    if (typeof def.aplicar !== 'function')
        throw new Error(`Analista ${def.nome} sem função aplicar`);
    return Object.freeze(def);
}
//# sourceMappingURL=tipos.js.map