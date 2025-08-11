import type { SinaisProjeto, DiagnosticoProjeto } from '../tipos/tipos.js';

/**
 * Recebe sinais coletados e devolve o diagnóstico
 */
export function diagnosticarProjeto(sinais: SinaisProjeto): DiagnosticoProjeto {
  const positivos = Object.entries(sinais)
    .filter(([, valor]) => valor === true)
    .map(([chave]) => chave as keyof SinaisProjeto);

  let tipo: DiagnosticoProjeto['tipo'] = 'desconhecido';
  let confianca = 0.3;

  if ('ehFullstack' in sinais && sinais.ehFullstack) {
    tipo = 'fullstack';
    confianca = 0.95;
  } else if ('ehMonorepo' in sinais && sinais.ehMonorepo) {
    tipo = 'monorepo';
    confianca = 0.99;
  } else if (ehLanding(sinais)) {
    tipo = 'landing';
    confianca = 0.92;
  } else if (ehApi(sinais)) {
    tipo = 'api';
    confianca = 0.88;
  } else if (ehCli(sinais)) {
    tipo = 'cli';
    confianca = 0.85;
  } else if (ehLib(sinais)) {
    tipo = 'lib';
    confianca = 0.8;
  }

  return {
    tipo,
    sinais: positivos,
    confiabilidade: parseFloat(confianca.toFixed(2)),
  };
}

function ehLanding(s: SinaisProjeto): boolean {
  // Considera landing se temPages for true, mesmo sem components/controllers
  return !!(s.temPages === true);
}

function ehApi(s: SinaisProjeto): boolean {
  return !!(s.temApi ?? s.temControllers ?? s.temExpress);
}

function ehLib(s: SinaisProjeto): boolean {
  return !!(s.temSrc && !s.temComponents && !(s.temApi ?? false));
}

function ehCli(s: SinaisProjeto): boolean {
  return !!s.temCli;
}
