import path from 'node:path';
import { lerEstado } from './persistencia.js';

export type NomeacaoEstilo = 'kebab' | 'dots' | 'camel';

export interface OpcoesEstrategista {
  preset?: string; // nome do preset de estrutura
  raizCodigo?: string;
  criarSubpastasPorEntidade?: boolean;
  estiloPreferido?: NomeacaoEstilo;
  categoriasMapa?: Record<string, string>;
  ignorarPastas?: string[];
}

export const CATEGORIAS_DEFAULT: Required<NonNullable<OpcoesEstrategista['categoriasMapa']>> = {
  controller: 'controllers',
  controllers: 'controllers',
  webhook: 'webhooks',
  webhooks: 'webhooks',
  cliente: 'clients',
  client: 'clients',
  service: 'services',
  repository: 'repositories',
  config: 'config',
  test: '__tests__',
  spec: '__tests__',
  type: 'types',
  types: 'types',
  handler: 'handlers',
};

export const DEFAULT_OPCOES: Required<
  Pick<
    OpcoesEstrategista,
    'raizCodigo' | 'criarSubpastasPorEntidade' | 'categoriasMapa' | 'ignorarPastas'
  >
> &
  Pick<OpcoesEstrategista, 'estiloPreferido'> = {
  raizCodigo: 'src',
  criarSubpastasPorEntidade: true,
  estiloPreferido: 'kebab',
  categoriasMapa: { ...CATEGORIAS_DEFAULT },
  ignorarPastas: ['node_modules', '.git', 'dist', 'build', 'coverage', '.oraculo'],
};

// Presets de estrutura: baseiam-se nos defaults, aplicando ajustes de organização
export const PRESETS: Record<string, Partial<typeof DEFAULT_OPCOES> & { nome: string }> = {
  oraculo: {
    nome: 'oraculo',
    criarSubpastasPorEntidade: true,
    categoriasMapa: { ...CATEGORIAS_DEFAULT },
  },
  'node-community': {
    nome: 'node-community',
    criarSubpastasPorEntidade: false,
    categoriasMapa: {
      ...CATEGORIAS_DEFAULT,
    },
  },
  'ts-lib': {
    nome: 'ts-lib',
    criarSubpastasPorEntidade: false,
    categoriasMapa: {
      ...CATEGORIAS_DEFAULT,
    },
  },
};

export interface ParseNomeResultado {
  entidade: string | null;
  categoria: string | null;
}

export function normalizarRel(p: string): string {
  return p.replace(/\\/g, '/');
}

export function deveIgnorar(rel: string, ignorar: string[]): boolean {
  const norm = normalizarRel(rel);
  return ignorar.some((pat) => norm === pat || norm.startsWith(pat + '/'));
}

export function parseNomeArquivo(baseName: string): ParseNomeResultado {
  const semExt = baseName.replace(/\.[^.]+$/i, '');
  const lower = semExt.toLowerCase();

  const dotMatch = /^(?<ent>[\w-]+)\.(?<cat>[\w-]+)$/.exec(semExt);
  if (dotMatch?.groups)
    return { entidade: dotMatch.groups.ent, categoria: dotMatch.groups.cat.toLowerCase() };

  const kebabMatch = /^(?<ent>[\w-]+)-(?<cat>[\w-]+)$/.exec(lower);
  if (kebabMatch?.groups)
    return { entidade: kebabMatch.groups.ent, categoria: kebabMatch.groups.cat };

  const camelMatch =
    /^(?<ent>[A-Za-z][A-Za-z0-9]*?)(?<cat>Controller|Webhook|Cliente|Client|Service|Repository)$/.exec(
      semExt,
    );
  if (camelMatch?.groups)
    return { entidade: camelMatch.groups.ent, categoria: camelMatch.groups.cat.toLowerCase() };

  const tokens = [
    'controller',
    'controllers',
    'webhook',
    'webhooks',
    'cliente',
    'client',
    'service',
    'repository',
  ];
  for (const tk of tokens) {
    if (lower.endsWith('-' + tk) || lower.endsWith('.' + tk)) {
      const entidade = lower.replace(new RegExp(`[.-]${tk}$`), '');
      return { entidade: entidade || null, categoria: tk };
    }
  }
  return { entidade: null, categoria: null };
}

export function destinoPara(
  relPath: string,
  raizCodigo: string,
  criarSubpastasPorEntidade: boolean,
  categoriasMapa: Record<string, string>,
): { destinoDir: string | null; motivo?: string } {
  const baseName = path.posix.basename(normalizarRel(relPath));
  const { entidade, categoria } = parseNomeArquivo(baseName);
  if (!categoria) return { destinoDir: null };

  const pastaCategoria = categoriasMapa[categoria] || categoria.toLowerCase() + 's';
  if (criarSubpastasPorEntidade && entidade) {
    const ent = entidade
      .toString()
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase();
    const dir = path.posix.join(raizCodigo, 'domains', ent, pastaCategoria);
    return { destinoDir: dir, motivo: `categoria ${categoria} organizada por entidade ${ent}` };
  }
  return {
    destinoDir: path.posix.join(raizCodigo, pastaCategoria),
    motivo: `categoria ${categoria} organizada por camada`,
  };
}

export async function carregarConfigEstrategia(
  baseDir: string,
  overrides?: OpcoesEstrategista,
): Promise<Required<typeof DEFAULT_OPCOES>> {
  const caminho = path.join(baseDir, '.oraculo', 'estrutura.json');
  const lido = await lerEstado<Record<string, unknown> | []>(caminho);
  const cfgArquivo = (lido && !Array.isArray(lido) && typeof lido === 'object' ? lido : {}) as
    | (Partial<typeof DEFAULT_OPCOES> & { preset?: string })
    | {};

  const nomePreset = (overrides?.preset ||
    (cfgArquivo as { preset?: string }).preset ||
    'oraculo') as string;
  const preset = PRESETS[nomePreset]?.nome ? PRESETS[nomePreset] : PRESETS['oraculo'];

  const parcial: Partial<typeof DEFAULT_OPCOES> = {
    ...DEFAULT_OPCOES,
    ...(preset as Partial<typeof DEFAULT_OPCOES>),
    ...(cfgArquivo as Partial<typeof DEFAULT_OPCOES>),
    ...(overrides as Partial<typeof DEFAULT_OPCOES>),
  };
  const merged: Required<typeof DEFAULT_OPCOES> = {
    raizCodigo: parcial.raizCodigo ?? DEFAULT_OPCOES.raizCodigo,
    criarSubpastasPorEntidade:
      parcial.criarSubpastasPorEntidade ?? DEFAULT_OPCOES.criarSubpastasPorEntidade,
    estiloPreferido: (parcial.estiloPreferido ?? DEFAULT_OPCOES.estiloPreferido) as NomeacaoEstilo,
    categoriasMapa: parcial.categoriasMapa ?? DEFAULT_OPCOES.categoriasMapa,
    ignorarPastas: parcial.ignorarPastas ?? DEFAULT_OPCOES.ignorarPastas,
  };
  // Garante que categoriasMapa tenha defaults base
  merged.categoriasMapa = { ...CATEGORIAS_DEFAULT, ...merged.categoriasMapa };
  return merged;
}
