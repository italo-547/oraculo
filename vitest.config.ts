import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig(() => {
  const isCI = process.env.CI === 'true';
  const coverageEnabled = isCI || process.env.COVERAGE === 'true';
  const enforceThresholds =
    isCI || process.env.COVERAGE_ENFORCE === 'true' || process.env.COVERAGE === 'true';
  // Coverage provider can be overridden with env COVERAGE_PROVIDER (e.g. 'v8' or 'c8').
  // Default to 'c8' which produces LCOV/JSON summaries and usually works better with TS sourcemaps.
  const coverageProvider = process.env.COVERAGE_PROVIDER || 'c8';
  // vitest typing expects provider to be a known literal. Map 'c8' → 'istanbul' at runtime.
  const providerMapped =
    coverageProvider === 'c8' ? 'istanbul' : coverageProvider === 'v8' ? 'v8' : 'v8';
  const rootAbs = path.resolve(process.cwd());
  // Ambiente/Execução
  const onWindows = process.platform === 'win32';
  const requestedPool = String(process.env.VITEST_POOL || '').toLowerCase();
  const pool =
    requestedPool === 'forks' || requestedPool === 'threads'
      ? (requestedPool as 'forks' | 'threads')
      : onWindows
        ? 'forks' // forks tende a ser mais estável no Windows para evitar "Timeout calling onTaskUpdate"
        : 'threads';
  const maxWorkersEnv = Number(process.env.VITEST_MAX_WORKERS || (onWindows ? '1' : ''));
  // Mapear aliases do tsconfig para o Vitest/Vite resolver, sem depender de plugins externos.
  // Mantém os aliases principais do projeto conforme tsconfig.json.
  const alias = [
    { find: '@analistas', replacement: path.join(rootAbs, 'src', 'analistas') },
    { find: '@arquitetos', replacement: path.join(rootAbs, 'src', 'arquitetos') },
    { find: '@nucleo', replacement: path.join(rootAbs, 'src', 'nucleo') },
    { find: '@zeladores', replacement: path.join(rootAbs, 'src', 'zeladores') },
    { find: '@relatorios', replacement: path.join(rootAbs, 'src', 'relatorios') },
    { find: '@guardian', replacement: path.join(rootAbs, 'src', 'guardian') },
    { find: '@tipos', replacement: path.join(rootAbs, 'src', 'tipos') },
    // Alias genérico '@' para suportar imports do tipo '@/arquivo'
    { find: '@', replacement: path.join(rootAbs, 'src') },
  ].map((a) => ({ ...a, replacement: a.replacement.replace(/\\/g, '/') }));

  return {
    resolve: { alias },
    plugins: [
      {
        name: 'oraculo-resolve-src-ts-from-js',
        enforce: 'pre',
        resolveId(source, importer) {
          try {
            if (!importer) return null;
            if (!source.endsWith('.js')) return null;
            if (!(source.startsWith('.') || source.startsWith('/'))) return null;

            const cleanId = (id: string) =>
              id
                .split('?')[0]
                .split('#')[0]
                .replace(/^\/@fs\//, '');
            let importerPath = cleanId(importer);
            if (importerPath.startsWith('file://')) importerPath = fileURLToPath(importerPath);
            const importerPosix = importerPath.replace(/\\/g, '/');
            const testsIdx = importerPosix.lastIndexOf('/tests/');
            const scope =
              testsIdx >= 0 ? importerPosix.slice(testsIdx + '/tests/'.length).split('/')[0] : '';

            let abs: string;
            if (source.startsWith('/')) {
              abs = path.join(rootAbs, source);
            } else {
              // Suporte especial: '../<topDir>/...' vindo de testes deve apontar para src/<topDir>/...
              const m = source.match(
                /^\.\.\/(analistas|arquitetos|cli|guardian|nucleo|relatorios|tipos|zeladores)\/(.*)$/,
              );
              if (m) {
                abs = path.join(rootAbs, 'src', m[1], m[2]);
              } else if (source.startsWith('./') && scope) {
                // Suporte para './<modulo>.js' a partir de testes/<escopo>/ → src/<escopo>/<modulo>.ts
                abs = path.join(rootAbs, 'src', scope, source.slice(2));
              } else {
                abs = path.resolve(path.dirname(importerPath), source);
              }
            }

            if (fs.existsSync(abs)) return null;

            const asTs = abs.replace(/\.js$/i, '.ts');
            if (fs.existsSync(asTs)) {
              const posix = asTs.replace(/\\/g, '/');
              return `/@fs/${posix}`;
            }

            const idxSrc = source.indexOf('/src/');
            if (idxSrc >= 0) {
              const sub = source.slice(idxSrc);
              const absFromRoot = path.join(rootAbs, sub);
              const asTsRoot = absFromRoot.replace(/\.js$/i, '.ts');
              if (fs.existsSync(asTsRoot)) {
                const posix = asTsRoot.replace(/\\/g, '/');
                return `/@fs/${posix}`;
              }
            }
          } catch {}
          return null;
        },
      },
      {
        name: 'oraculo-transform-tests-js-to-ts',
        enforce: 'pre',
        transform(code, id) {
          try {
            const cleanId = (s: string) => s.split('?')[0].split('#')[0];
            let file = cleanId(id);
            if (file.startsWith('file://')) file = fileURLToPath(file);
            const isTest = file.replace(/\\/g, '/').includes('/tests/');
            if (!isTest) return null;

            let changed = false;
            let out = code;

            // 1) Reescreve imports relativos que contêm '/src/' terminando com .js → .ts
            out = out.replace(
              /(['"`])(\.\.?(:?\/[^'"`]+)*)\/src\/([^'"`]+?)\.js\1/g,
              (full, quote: string, rel: string, rest: string) => {
                try {
                  const spec = `${rel}/src/${rest}.js`;
                  const absJs = path.resolve(path.dirname(file), spec);
                  const absTs = absJs.replace(/\.js$/i, '.ts');
                  if (!fs.existsSync(absJs) && fs.existsSync(absTs)) {
                    changed = true;
                    return `${quote}${rel}/src/${rest}.ts${quote}`;
                  }
                } catch {}
                return full;
              },
            );

            // 2) Reescreve alvos de vi.mock/vi.doMock relativos para apontar ao src/*.ts
            const topDirs = [
              'analistas',
              'arquitetos',
              'cli',
              'guardian',
              'nucleo',
              'relatorios',
              'tipos',
              'zeladores',
            ];
            const scope = (() => {
              const rel = file.replace(/\\/g, '/');
              const i = rel.lastIndexOf('/tests/');
              if (i >= 0) {
                const after = rel.slice(i + '/tests/'.length);
                const firstSeg = after.split('/')[0];
                if (firstSeg) return firstSeg;
              }
              return '';
            })();
            out = out.replace(
              /(vi\.(?:do)?mock\(\s*['"])([^'"`]+)(['"`])/g,
              (_full, prefix: string, spec: string, suffix: string) => {
                let target = spec;
                try {
                  const isRel = spec.startsWith('./') || spec.startsWith('../');
                  const hasSrc = spec.includes('/src/');
                  if (isRel) {
                    if (!hasSrc) {
                      if (spec.startsWith('./') && scope) {
                        target = `../../src/${scope}/${spec.slice(2)}`;
                      } else if (spec.startsWith('../')) {
                        const rest = spec.replace(/^\.\.\/+/, '');
                        if (topDirs.some((d) => rest.startsWith(d + '/'))) {
                          target = `../../src/${rest}`;
                        }
                      }
                    }
                    // Resolve caminho absoluto e garanta .ts quando aplicável
                    let absTarget = path.resolve(path.dirname(file), target);
                    if (/\.js$/i.test(absTarget)) {
                      const absTs = absTarget.replace(/\.js$/i, '.ts');
                      if (!fs.existsSync(absTarget) && fs.existsSync(absTs)) {
                        absTarget = absTs;
                        changed = true;
                      }
                    }
                    const posix = absTarget.replace(/\\/g, '/');
                    target = `/@fs/${posix}`;
                  }
                } catch {}
                return `${prefix}${target}${suffix}`;
              },
            );

            // 3) Reescreve alvos de vi.mock/vi.doMock que já apontam para '../../src/.../*.js' → caminho absoluto /@fs com .ts
            //    Isso alinha os IDs de módulo usados nos mocks com os IDs resolvidos pelo plugin resolveId para o código fonte.
            out = out.replace(
              /(vi\.(?:do)?mock\(\s*['"])(\.?\.?.*?\/src\/[^'"`]+?)\.js(['"`])/g,
              (_full, prefix: string, relSpec: string, suffix: string) => {
                try {
                  const abs = path.resolve(path.dirname(file), relSpec);
                  const absTs = abs.replace(/\.js$/i, '.ts');
                  const chosen = fs.existsSync(absTs) && !fs.existsSync(abs) ? absTs : abs;
                  const posix = chosen.replace(/\\/g, '/');
                  changed = true;
                  return `${prefix}/@fs/${posix}${suffix}`;
                } catch {
                  return `${prefix}${relSpec}.ts${suffix}`; // fallback simples
                }
              },
            );

            return changed || out !== code ? { code: out, map: null } : null;
          } catch {
            return null;
          }
        },
      },
    ],
    test: {
      globals: true,
      environment: 'node',
      // Aumentar timeout global para acomodar E2E longos (ms). Permite overrides locais.
      testTimeout: Number(process.env.VITEST_TEST_TIMEOUT_MS || 120000),
      // Pool de execução — usa forks por padrão no Windows para evitar RPC timeouts do runner
      pool,
      // Limita workers quando necessário (padrão 1 no Windows; pode ser sobrescrito via VITEST_MAX_WORKERS)
      ...(Number.isFinite(maxWorkersEnv) && maxWorkersEnv > 0 ? { maxWorkers: maxWorkersEnv } : {}),
      // Em Windows, reduzir paralelismo para evitar timeouts de RPC (onTaskUpdate) em execuções longas.
      poolOptions: {
        threads: {
          singleThread: process.platform === 'win32',
        },
      },
      // Evita paralelismo por arquivo no Windows; pode ser ajustado via flags/env conforme necessidade
      fileParallelism: !onWindows,
      sequence: {
        concurrent: process.platform !== 'win32',
      },
      include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
      exclude: [
        '.deprecados/**',
        '.abandonados/**',
        'tests/fixtures/estruturas/**/node_modules/**',
      ],
      coverage: {
        provider: providerMapped as 'v8' | 'istanbul',
        reportsDirectory: './coverage',
        enabled: coverageEnabled,
        include: ['src/**/*.ts'],
        // load exclude patterns from scripts/coverage-exclude.json if available to keep a single source
        exclude: ((): string[] => {
          try {
            const exPath = path.join(rootAbs, 'scripts', 'coverage-exclude.json');
            if (fs.existsSync(exPath)) {
              const raw = fs.readFileSync(exPath, 'utf8');
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed as string[];
            }
          } catch {}
          return [];
        })(),
        all: false,
        ...(enforceThresholds
          ? {
              // Limiar mínimo para evitar regressões: 90% em todas as métricas
              thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
            }
          : {}),
      },
    },
  };
});
