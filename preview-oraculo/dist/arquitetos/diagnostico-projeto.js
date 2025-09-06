/**
 * Recebe sinais coletados e devolve o diagnóstico
 */
export function diagnosticarProjeto(sinais) {
    const positivos = Object.entries(sinais)
        .filter(([, valor]) => valor === true)
        .map(([chave]) => chave);
    let tipo = 'desconhecido';
    let confianca = 0.3;
    if ('ehFullstack' in sinais && sinais.ehFullstack) {
        tipo = 'fullstack';
        confianca = 0.95;
    }
    else if ('ehMonorepo' in sinais && sinais.ehMonorepo) {
        tipo = 'monorepo';
        confianca = 0.99;
    }
    else if (ehLanding(sinais)) {
        tipo = 'landing';
        confianca = 0.92;
    }
    else if (ehApi(sinais)) {
        tipo = 'api';
        confianca = 0.88;
    }
    else if (ehCli(sinais)) {
        tipo = 'cli';
        confianca = 0.85;
    }
    else if (ehLib(sinais)) {
        tipo = 'lib';
        confianca = 0.8;
    }
    // Mantém valor de confiança original (0..1) sem arredondar para evitar perda de precisão
    return { tipo, sinais: positivos, confiabilidade: confianca };
}
function ehLanding(s) {
    // Considera landing se temPages for true, mesmo sem components/controllers
    return !!(s.temPages === true);
}
function ehApi(s) {
    return !!(s.temApi ?? s.temControllers ?? s.temExpress);
}
function ehLib(s) {
    return !!(s.temSrc && !s.temComponents && !(s.temApi ?? false));
}
function ehCli(s) {
    return !!s.temCli;
}
//# sourceMappingURL=diagnostico-projeto.js.map