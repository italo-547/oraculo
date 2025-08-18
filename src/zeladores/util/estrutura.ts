// SPDX-License-Identifier: MIT
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
    // No preset "oraculo" não organizamos por entidade/domains
    criarSubpastasPorEntidade: false,
    categoriasMapa: { ...CATEGORIAS_DEFAULT },
    ignorarPastas: [
      ...DEFAULT_OPCOES.ignorarPastas,
      'tests',
      'tests/fixtures',
      'src/analistas',
      'src/arquitetos',
      'src/relatorios',
      'src/guardian',
      'src/nucleo',
      'src/cli',
      'src/zeladores',
      'src/tipos',
    ],
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
  // Ignora se qualquer padrão ocorrer em qualquer nível do caminho (não apenas na raiz)
  // Exemplos suportados:
  //  - 'node_modules' casa 'node_modules/...', 'a/b/node_modules/...'
  //  - 'dist' casa 'dist/...', 'x/dist/...'
  //  - padrões com subpastas ('coverage/html') ainda casam por substring segmentada
  return ignorar.some((raw) => {
    const pat = normalizarRel(raw);
    if (!pat) return false;
    if (norm === pat) return true;
    if (norm.startsWith(pat + '/')) return true;
    if (norm.endsWith('/' + pat)) return true;
    // Casa por segmento intermediário:
    //  - '/pat/' ocorre no meio do caminho
    //  - ou qualquer segmento exatamente igual ao pat (quando pat é um único segmento)
    if (norm.includes('/' + pat + '/')) return true;
    if (!pat.includes('/')) {
      const segs = norm.split('/');
      if (segs.includes(pat)) return true;
    }
    return false;
  });
}

export function parseNomeArquivo(baseName: string): ParseNomeResultado {
  const semExt = baseName.replace(/\.[^.]+$/i, '');
  const lower = semExt.toLowerCase();

  // Apenas aceite categorias reconhecidas (singular/plural) para evitar falsos positivos
  const CATS = new Set(Object.keys(CATEGORIAS_DEFAULT).map((c) => c.toLowerCase()));

  const dotMatch = /^(?<ent>[\w-]+)\.(?<cat>[\w-]+)$/.exec(semExt);
  if (dotMatch?.groups) {
    const cat = dotMatch.groups.cat.toLowerCase();
    if (CATS.has(cat)) return { entidade: dotMatch.groups.ent, categoria: cat };
  }

  const kebabMatch = /^(?<ent>[\w-]+)-(?<cat>[\w-]+)$/.exec(lower);
  if (kebabMatch?.groups) {
    const cat = kebabMatch.groups.cat.toLowerCase();
    if (CATS.has(cat)) return { entidade: kebabMatch.groups.ent, categoria: cat };
  }

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

  // Evita pluralização incorreta quando já termina com 's'
  const normCat = categoria.toLowerCase();
  const pastaFinal = categoriasMapa[normCat] || (normCat.endsWith('s') ? normCat : normCat + 's');
  if (criarSubpastasPorEntidade && entidade) {
    const ent = entidade
      .toString()
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase();
    const dir = path.posix.join(raizCodigo, 'domains', ent, pastaFinal);
    return { destinoDir: dir, motivo: `categoria ${categoria} organizada por entidade ${ent}` };
  }
  return {
    destinoDir: path.posix.join(raizCodigo, pastaFinal),
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

  // Merge determinístico: DEFAULT -> PRESET -> ARQUIVO -> OVERRIDES (apenas chaves definidas)
  const base = { ...DEFAULT_OPCOES } as Required<typeof DEFAULT_OPCOES>;
  const aplicarParcial = (src?: Partial<typeof DEFAULT_OPCOES>) => {
    if (!src) return;
    if (src.raizCodigo) base.raizCodigo = src.raizCodigo as string;
    if (typeof src.criarSubpastasPorEntidade === 'boolean')
      base.criarSubpastasPorEntidade = src.criarSubpastasPorEntidade as boolean;
    if (src.estiloPreferido) base.estiloPreferido = src.estiloPreferido as NomeacaoEstilo;
    if (src.categoriasMapa)
      base.categoriasMapa = { ...base.categoriasMapa, ...src.categoriasMapa } as Record<
        string,
        string
      >;
    if (src.ignorarPastas && Array.isArray(src.ignorarPastas))
      base.ignorarPastas = Array.from(new Set([...base.ignorarPastas, ...src.ignorarPastas]));
  };
  aplicarParcial(preset as Partial<typeof DEFAULT_OPCOES>);
  aplicarParcial(cfgArquivo as Partial<typeof DEFAULT_OPCOES>);
  aplicarParcial(overrides as Partial<typeof DEFAULT_OPCOES>);

  // Garante que categoriasMapa tenha defaults base
  base.categoriasMapa = { ...CATEGORIAS_DEFAULT, ...base.categoriasMapa } as Record<string, string>;
  return base;
}
