/**
 * Recebe sinais coletados e devolve o diagnóstico
 */
export function diagnosticarProjeto(sinais) {
    const positivos = Object.entries(sinais)
        .filter(([, valor]) => valor === true)
        .map(([chave]) => chave);
    let tipo = 'desconhecido';
    let confianca = 0.3;
    if (sinais.ehFullstack) {
        tipo = 'fullstack';
        confianca = 0.95;
    }
    else if (sinais.ehMonorepo) {
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
        confianca = 0.80;
    }
    return {
        tipo,
        sinais: positivos,
        confiabilidade: parseFloat(confianca.toFixed(2))
    };
}
// Helpers (podem ser movidos para um módulo util futuramente)
function ehLanding(s) {
    return !!(s.temPages && s.temComponents && !s.temControllers);
}
function ehApi(s) {
    return !!(s.temApi || s.temControllers || s.temExpress);
}
function ehLib(s) {
    return !!(s.temSrc && !s.temComponents && !s.temApi);
}
function ehCli(s) {
    return !!s.temCli;
}
