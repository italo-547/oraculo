import path from 'node:path';
import { config } from '../nucleo/constelacao/cosmos.js';
import type { PlanoSugestaoEstrutura } from '../tipos/tipos.js';

// Regex (zona verde) – sincronizar com docs/estruturas/README.md
const REGEX_TESTE_RAIZ = /\.test\.ts$/i;
const REGEX_SCRIPT = /^script-.+\.(?:js|ts)$/i;
const REGEX_CONFIG = /^(?!tsconfig)([\w.-]+)\.config\.(?:js|ts|cjs|mjs)$/i;
const REGEX_DECLARACAO_TIPOS = /\.d\.ts$/i;
const REGEX_README_FRAGMENT = /^README-fragment-.+\.md$/i;

interface ArquivoMeta {
  relPath: string;
  size?: number;
}

export function gerarPlanoReorganizacao(arquivos: ArquivoMeta[]): PlanoSugestaoEstrutura {
  if (config.SCAN_ONLY)
    return { mover: [], conflitos: [], resumo: { total: 0, zonaVerde: 0, bloqueados: 0 } };
  const mover: { de: string; para: string; motivo: string }[] = [];
  const conflitos: { alvo: string; motivo: string }[] = [];
  const relPaths = arquivos.map((a) => a.relPath);
  const raizFiles = arquivos.filter((a) => !a.relPath.includes('/'));
  const maxSize = config.ESTRUTURA_PLANO_MAX_FILE_SIZE || 256 * 1024;

  const pushMove = (de: string, para: string, motivo: string, size?: number) => {
    if (size && size > maxSize) return; // ignora grandes
    if (relPaths.includes(para)) conflitos.push({ alvo: para, motivo: 'já existe' });
    else mover.push({ de, para, motivo });
  };

  for (const f of raizFiles) {
    const { relPath, size } = f;
    if (REGEX_TESTE_RAIZ.test(relPath))
      pushMove(
        relPath,
        path.posix.join('src', relPath),
        'teste disperso na raiz – mover para src/',
        size,
      );
    else if (REGEX_SCRIPT.test(relPath))
      pushMove(
        relPath,
        path.posix.join('src', 'scripts', relPath.replace(/^script-/, '')),
        'script operacional – consolidar em src/scripts/',
        size,
      );
    else if (REGEX_CONFIG.test(relPath))
      pushMove(relPath, path.posix.join('config', relPath), 'config centralizada em config/', size);
    else if (REGEX_DECLARACAO_TIPOS.test(relPath))
      pushMove(
        relPath,
        path.posix.join('types', relPath),
        'declaração de tipos – mover para types/',
        size,
      );
    else if (REGEX_README_FRAGMENT.test(relPath))
      pushMove(
        relPath,
        path.posix.join('docs', 'fragments', relPath),
        'fragmento documental – organizar em docs/fragments/',
        size,
      );
  }

  const seen = new Set<string>();
  const moverFiltrado = mover.filter((m) => {
    const k = m.de + '->' + m.para;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    mover: moverFiltrado,
    conflitos,
    resumo: {
      total: moverFiltrado.length + conflitos.length,
      zonaVerde: moverFiltrado.length,
      bloqueados: conflitos.length,
    },
  };
}
