//
// 📂 Integridade e Erros
//
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
