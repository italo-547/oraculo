import path from 'node:path';

// Normaliza um caminho relativo eliminando tentativas de escape (..), barras duplicadas e separadores inconsistentes
export function sanitizarRelPath(rel: string): string {
  if (!rel) return '';
  rel = rel.replace(/^[A-Za-z]:\\?/u, '').replace(/^\/+/, '');
  const norm = rel.replace(/\\+/g, '/');
  const collapsed = path.posix.normalize(norm);
  if (collapsed.startsWith('..')) return collapsed.replace(/^\.+/g, '');
  return collapsed;
}

export function estaDentro(baseDir: string, alvo: string): boolean {
  const rel = path.relative(baseDir, alvo);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function resolverPluginSeguro(
  baseDir: string,
  pluginRel: string,
): { caminho?: string; erro?: string } {
  try {
    if (typeof pluginRel !== 'string' || !pluginRel.trim()) {
      return { erro: 'entrada de plugin inválida (string vazia)' };
    }
    const resolvido = path.resolve(baseDir, pluginRel);
    if (!estaDentro(baseDir, resolvido)) {
      return { erro: 'plugin fora da raiz do projeto (bloqueado)' };
    }
    return { caminho: resolvido };
  } catch (e) {
    return { erro: (e as Error).message || String(e) };
  }
}

export function validarGlobBasico(padrao: string): boolean {
  if (padrao.length > 300) return false;
  const repeticaoExcessiva = /(\*\*){5,}/.test(padrao);
  if (repeticaoExcessiva) return false;
  return true;
}

export function filtrarGlobSeguros(padroes: string[]): string[] {
  return padroes.filter((p) => validarGlobBasico(p));
}
