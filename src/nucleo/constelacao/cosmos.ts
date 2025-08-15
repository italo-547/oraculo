import { promises as fs } from 'node:fs';
import path from 'node:path';

// Diretório atual do usuário (base do projeto)
const CWD = process.cwd();

// Diretórios internos do Oráculo
const ORACULO_STATE = path.join(CWD, '.oraculo');
const ZELADOR_ABANDONED = path.join(ORACULO_STATE, 'abandonados');

// Configuração global do sistema Oráculo
export const configDefault = {
  VERBOSE: false,
  // 🌱 Flags gerais
  DEV_MODE: process.env.NODE_ENV === 'development' || process.env.ORACULO_DEV === 'true',
  AUTOANALISE_CONCURRENCY: 5,

  // 🛡️ Guardian
  GUARDIAN_ENABLED: true,
  GUARDIAN_ENFORCE_PROTECTION: true,
  GUARDIAN_BASELINE: path.join(ORACULO_STATE, 'baseline.json'),
  GUARDIAN_ALLOW_ADDS: false,
  GUARDIAN_ALLOW_CHG: false,
  GUARDIAN_ALLOW_DELS: false,
  // Padrões ignorados somente para o Guardian (não impacta scanner geral / analistas)
  GUARDIAN_IGNORE_PATTERNS: [
    // Dependências e artefatos externos
    'node_modules',
    'node_modules/**',
    '**/node_modules/**',
    '.pnpm/**',
    // Estado interno / cache / builds
    '.oraculo/**',
    'dist/**',
    'coverage/**',
    'build/**',
    // Arquivos temporários e lockfiles
    '*.log',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    // VCS
    '.git/**',
  ],

  // 📄 Relatórios
  REPORT_SILENCE_LOGS: false,
  REPORT_EXPORT_ENABLED: false,
  REPORT_OUTPUT_DIR: path.join(CWD, 'relatorios'),
  // Relatório de Saúde (controle de exibição)
  // Quando true, usa tabela com moldura no modo normal/compact (ruído reduzido)
  RELATORIO_SAUDE_TABELA_ENABLED: true,
  // Quando true, em modo VERBOSE a tabela é desativada e exibimos lista detalhada
  RELATORIO_SAUDE_DETALHADO_VERBOSE: true,

  // 📂 Zelador
  ORACULO_STATE_DIR: ORACULO_STATE,
  ZELADOR_ABANDONED_DIR: ZELADOR_ABANDONED,
  ZELADOR_PENDING_PATH: path.join(ORACULO_STATE, 'pendentes.json'),
  ZELADOR_REACTIVATE_PATH: path.join(ORACULO_STATE, 'reativar.json'),
  ZELADOR_HISTORY_PATH: path.join(ORACULO_STATE, 'historico.json'),
  ZELADOR_REPORT_PATH: path.join(ORACULO_STATE, 'poda-oraculo.md'),
  ZELADOR_GHOST_INACTIVITY_DAYS: 30,
  ZELADOR_IGNORE_PATTERNS: [
    '.git',
    'oraculo',
    'dist',
    'build',
    'coverage',
    // Evita varredura de dependências externas – melhora performance e reduz ruído do Guardian
    'node_modules',
    'package-lock.json',
    'yarn.lock',
  ],
  // Padrões adicionais controlados via CLI para filtragem dinâmica pontual
  CLI_INCLUDE_PATTERNS: [] as string[], // quando não vazio: somente arquivos que casem algum pattern serão considerados (override dos ignores padrão)
  CLI_EXCLUDE_PATTERNS: [] as string[], // sempre excluídos (aplicado após include)
  ZELADOR_LINE_THRESHOLD: 20,

  // 🔍 Analistas
  SCANNER_EXTENSOES_COM_AST: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
  VIGIA_TOP_N: 10,
  ANALISE_LIMITES: {
    FUNCOES_LONGAS: {
      MAX_LINHAS: 30,
      MAX_PARAMETROS: 4,
      MAX_ANINHAMENTO: 3,
    },
  },
  ANALISE_AST_CACHE_ENABLED: true,
  ANALISE_METRICAS_ENABLED: true,
  // Caminho de histórico de métricas (migrado para subdir dedicado; arquivo antigo na raiz ainda lido como fallback em runtime onde aplicável)
  ANALISE_METRICAS_HISTORICO_PATH: path.join(
    ORACULO_STATE,
    'historico-metricas',
    'metricas-historico.json',
  ),
  ANALISE_METRICAS_HISTORICO_MAX: 200,
  // Priorização de arquivos (usa histórico incremental anterior)
  ANALISE_PRIORIZACAO_ENABLED: true,
  ANALISE_PRIORIZACAO_PESOS: {
    duracaoMs: 1,
    ocorrencias: 2,
    penalidadeReuso: 0.5,
  },
  LOG_ESTRUTURADO: false,
  // Incremental desabilitado por padrão para evitar efeitos colaterais em testes; habilite explicitamente onde necessário
  ANALISE_INCREMENTAL_ENABLED: false,
  ANALISE_INCREMENTAL_STATE_PATH: path.join(ORACULO_STATE, 'incremental-analise.json'),
  ANALISE_INCREMENTAL_VERSION: 1,

  // Performance (snapshots sintéticos)
  PERF_SNAPSHOT_DIR: path.join('docs', 'perf'),

  // Estrutura – diretórios alvo padronizados (evita literais dispersos)
  ESTRUTURA_TARGETS: {
    TESTS_RAIZ_DIR: 'src',
    SCRIPTS_DIR: path.posix.join('src', 'scripts'),
    CONFIG_DIR: 'config',
    TYPES_DIR: 'types',
    DOCS_FRAGMENTS_DIR: path.posix.join('docs', 'fragments'),
  },

  // Estrutura (plugins, layers, auto-fix, concorrência)
  STRUCTURE_PLUGINS: [],
  STRUCTURE_AUTO_FIX: false,
  STRUCTURE_CONCURRENCY: 5,
  STRUCTURE_LAYERS: {},
  // Limite de tamanho (bytes) para considerar mover arquivo em plano de reorganização
  ESTRUTURA_PLANO_MAX_FILE_SIZE: 256 * 1024, // ~250KB
  // Limite de arquivos considerados "muitos arquivos na raiz" (ajustável por repo)
  ESTRUTURA_ARQUIVOS_RAIZ_MAX: 10,

  // Compatibilidade/legado
  STATE_DIR: ORACULO_STATE,
  ZELADOR_STATE_DIR: ORACULO_STATE,
  COMPACT_MODE: false,
  // Modo somente varredura (sem AST, sem técnicas) quando ativado por flag
  SCAN_ONLY: false,
  // Alias semântico (uniformização com ANALISE_*) – manter sincronizado com SCAN_ONLY
  ANALISE_SCAN_ONLY: false,
  // Controle de ruído de erros de parsing
  PARSE_ERRO_AGRUPAR: true, // quando true, múltiplos erros no mesmo arquivo são consolidados
  PARSE_ERRO_MAX_POR_ARQUIVO: 1, // limite de ocorrências individuais por arquivo antes de agrupar
  // Se verdadeiro, qualquer PARSE_ERRO (mesmo agregado) provoca exit code 1
  PARSE_ERRO_FALHA: false,
};

// Clonamos para instância mutável
export const config: typeof configDefault & {
  __OVERRIDES__?: Record<string, { from: unknown; to: unknown; fonte: string }>;
} = JSON.parse(JSON.stringify(configDefault));

type DiffRegistro = { from: unknown; to: unknown; fonte: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(
  target: Record<string, unknown>,
  src: Record<string, unknown>,
  fonte: string,
  diffs: Record<string, DiffRegistro>,
  prefix = '',
): void {
  for (const k of Object.keys(src || {})) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    const srcVal = src[k];
    const tgtVal = target[k];
    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
        fonte,
        diffs,
        keyPath,
      );
    } else if (srcVal !== undefined) {
      if (tgtVal !== srcVal) {
        diffs[keyPath] = { from: tgtVal, to: srcVal, fonte };
      }
      // atribuição dinâmica segura
      (target as Record<string, unknown>)[k] = srcVal as unknown;
    }
  }
}

async function carregarArquivoConfig(): Promise<Record<string, unknown> | null> {
  // Ordem de busca simples
  const candidatos = ['oraculo.config.json', 'src/config.json'];
  for (const nome of candidatos) {
    try {
      const conteudo = await fs.readFile(path.join(process.cwd(), nome), 'utf-8');
      const json = conteudo.trim() ? JSON.parse(conteudo) : null;
      if (json) return json;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function carregarEnvConfig(): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};
  // Mapeia cada chave do default para uma env ORACULO_<KEY>
  const stack: Array<{ obj: Record<string, unknown>; prefix: string }> = [
    { obj: configDefault as unknown as Record<string, unknown>, prefix: '' },
  ];
  while (stack.length) {
    const popped = stack.pop();
    if (!popped) break;
    const { obj, prefix } = popped;
    for (const k of Object.keys(obj)) {
      const keyPath = prefix ? `${prefix}.${k}` : k;
      const envName = `ORACULO_${keyPath.replace(/\./g, '_').toUpperCase()}`;
      const currentVal = (obj as Record<string, unknown>)[k];
      if (isPlainObject(currentVal)) {
        stack.push({ obj: currentVal, prefix: keyPath });
      } else {
        const rawEnv = process.env[envName];
        if (rawEnv !== undefined) {
          let val: unknown = rawEnv;
          if (/^(true|false)$/i.test(rawEnv)) val = rawEnv.toLowerCase() === 'true';
          else if (/^-?\d+(\.\d+)?$/.test(rawEnv)) val = Number(rawEnv);
          resultadoPathAssign(resultado, keyPath, val);
        }
      }
    }
  }
  return resultado;
}

function resultadoPathAssign(base: Record<string, unknown>, keyPath: string, value: unknown) {
  const parts = keyPath.split('.');
  let cursor: Record<string, unknown> = base;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    let next = cursor[p];
    if (!isPlainObject(next)) {
      next = {};
      cursor[p] = next;
    }
    cursor = next as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

export async function inicializarConfigDinamica(overridesCli?: Record<string, unknown>) {
  const diffs: Record<string, DiffRegistro> = {};
  const arquivo = await carregarArquivoConfig();
  if (arquivo)
    deepMerge(
      config as unknown as Record<string, unknown>,
      arquivo as Record<string, unknown>,
      'arquivo',
      diffs,
    );
  const envCfg = carregarEnvConfig();
  if (Object.keys(envCfg).length)
    deepMerge(config as unknown as Record<string, unknown>, envCfg, 'env', diffs);
  if (overridesCli && Object.keys(overridesCli).length)
    deepMerge(
      config as unknown as Record<string, unknown>,
      overridesCli as Record<string, unknown>,
      'cli',
      diffs,
    );
  // Fallback de migração: se novo caminho de histórico não existe mas arquivo antigo existe, aponta para antigo
  try {
    const novoHist = config.ANALISE_METRICAS_HISTORICO_PATH as string;
    const antigoHist = path.join(ORACULO_STATE, 'metricas-historico.json');
    if (novoHist && antigoHist !== novoHist) {
      const [existeNovo, existeAntigo] = await Promise.all([
        fs
          .access(novoHist)
          .then(() => true)
          .catch(() => false),
        fs
          .access(antigoHist)
          .then(() => true)
          .catch(() => false),
      ]);
      if (!existeNovo && existeAntigo) {
        config.ANALISE_METRICAS_HISTORICO_PATH = antigoHist;
        diffs['ANALISE_METRICAS_HISTORICO_PATH'] = {
          from: novoHist,
          to: antigoHist,
          fonte: 'fallback-migracao',
        };
      }
    }
  } catch {
    /* ignore */
  }
  // Sincroniza alias de modo somente varredura
  if (config.ANALISE_SCAN_ONLY && !config.SCAN_ONLY) config.SCAN_ONLY = true;
  else if (config.SCAN_ONLY && !config.ANALISE_SCAN_ONLY) config.ANALISE_SCAN_ONLY = true;
  config.__OVERRIDES__ = diffs;
  return diffs;
}

export function aplicarConfigParcial(partial: Record<string, unknown>) {
  const diffs: Record<string, DiffRegistro> = {};
  deepMerge(config as unknown as Record<string, unknown>, partial, 'programatico', diffs);
  if (config.ANALISE_SCAN_ONLY && !config.SCAN_ONLY) config.SCAN_ONLY = true;
  else if (config.SCAN_ONLY && !config.ANALISE_SCAN_ONLY) config.ANALISE_SCAN_ONLY = true;
  config.__OVERRIDES__ = { ...(config.__OVERRIDES__ || {}), ...diffs };
  return diffs;
}

// Inicialização automática (arquivo + env) sem CLI (CLI aplicará depois)
void inicializarConfigDinamica();
