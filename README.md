# Oráculo CLI

[![CI](https://github.com/aynsken/oraculo/actions/workflows/ci.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/ci.yml)
[![Build](https://github.com/aynsken/oraculo/actions/workflows/build.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/build.yml)
[![Monitor Deps](https://github.com/aynsken/oraculo/actions/workflows/monitor-deps.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/monitor-deps.yml)
[![Testes](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/aynsken/oraculo/main/.oraculo/badge-test-stats.json)](docs/relatorios/RELATORIO.md)

![Node](https://img.shields.io/badge/node-%3E%3D24.x-339933?logo=node.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Último commit](https://img.shields.io/github/last-commit/aynsken/oraculo)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/aynsken/oraculo/dev/typescript?label=TypeScript)](https://github.com/aynsken/oraculo/blob/main/package.json)
[![ESLint](https://img.shields.io/github/package-json/dependency-version/aynsken/oraculo/dev/eslint?label=ESLint)](https://github.com/aynsken/oraculo/blob/main/package.json)
[![Prettier](https://img.shields.io/github/package-json/dependency-version/aynsken/oraculo/dev/prettier?label=Prettier)](https://github.com/aynsken/oraculo/blob/main/package.json)

Oráculo é uma CLI modular para analisar, diagnosticar e manter projetos (JavaScript/TypeScript e multi-stack leve), oferecendo diagnósticos estruturais, verificação de integridade (Guardian), sugestão de reorganização e métricas — tudo com contratos JSON consumíveis por CI.

## ✨ Principais Capacidades

- Diagnóstico de padrões & estrutura (`diagnosticar`)
- Verificação de integridade via hashes (`guardian`)
- Sugestão de reorganização segura (`planoSugestao`)
- Poda de arquivos órfãos (`podar`)
- Relatórios & métricas agregadas (`metricas`)
- Extensível com analistas / plugins (ESM)

## ⚙️ Requisitos

- Node.js >= 24.x
- npm >= 11.x

## 📦 Instalação

```bash
git clone https://github.com/aynsken/oraculo.git
cd oraculo
npm install
```

## 🖥️ Uso Rápido

```bash
npm run build
node dist/cli.js diagnosticar --json
node dist/cli.js guardian --diff --json
```

Instalação global opcional:

```bash
npm install -g .
oraculo diagnosticar
```

Durante testes (`process.env.VITEST`) a CLI não chama `process.exit`, permitindo inspeção controlada.

### Flags Globais

Você pode usar as flags globais em qualquer comando para controlar o nível de logs e exportação de relatórios:

| Flag          | Descrição                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------- |
| `--silence`   | Silencia todos os logs de informação e aviso (sobrepõe `--verbose`)                       |
| `--verbose`   | Exibe logs detalhados de cada arquivo e técnica analisada (ignorado se `--silence` ativo) |
| `--export`    | Gera arquivos de relatório detalhados (JSON e Markdown)                                   |
| `--debug`     | Ativa modo de desenvolvimento (logs detalhados de debug)                                  |
| `--dev`       | Alias legado para `--debug` (deprecado)                                                   |
| `--scan-only` | Executa somente varredura e priorização, sem aplicar técnicas                             |
| `--json`      | (diagnosticar/guardian) Saída estruturada JSON para uso em CI                             |

#### Exemplos de uso

```bash
# Diagnóstico limpo (padrão)
oraculo diagnosticar

# Diagnóstico detalhado (verbose)
oraculo diagnosticar --verbose

# Diagnóstico totalmente silencioso
oraculo diagnosticar --silence

# Exportar relatórios detalhados
oraculo diagnosticar --export

# Combinar flags (silence sempre sobrepõe verbose)
oraculo diagnosticar --export --verbose --silence
```

### Plugins & Extensões

Guia completo: `docs/plugins/GUIA.md`.

Persistência sempre via helpers `lerEstado` / `salvarEstado` (ver `TOOLING.md`).

### Instalação global (opcional)

Se quiser rodar o comando `oraculo` diretamente no terminal, instale globalmente:

```bash
npm install -g .
```

Assim, basta rodar:

```bash
oraculo <comando>
```

### Principais Comandos

| Comando        | Descrição                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `diagnosticar` | Análise completa (arquitetura, padrões, estrutura, guardian opcional). Suporta filtros `--include` e `--exclude` para glob patterns pontuais |
| `guardian`     | Cria/atualiza/verifica baseline de integridade                                                                                               |
| `podar`        | Lista ou remove (seguro) arquivos órfãos                                                                                                     |
| `metricas`     | Histórico agregado de métricas internas                                                                                                      |
| `analistas`    | Lista analistas registrados; suporta `--json`, `--output <arquivo>` e `--doc <arquivo>` para exportar catálogo                               |
| `reestruturar` | (experimental) Aplicar plano de reorganização                                                                                                |

Lista completa: `node dist/cli.js --help`.

## 🧪 Qualidade & Política de Testes

Cobertura mínima: Statements/Lines 90%, Branches 88%, Functions 90% (gate em CI). Detalhes e racional completo em `docs/TOOLING.md`.

Rodar testes: `npm test` | Cobertura: `npx vitest run --coverage`.

### Estratégia de Testes

1. Unidade: funções puras e helpers (preferir sem efeitos colaterais)
2. Integração: fluxo entre inquisidor / executor / analistas
3. Segurança: caminhos de falha e validações (plugins, glob, path)
4. Branch coverage: cenários alternativos (flags `--json`, erros agregados, diffs, fallback de hash)
5. E2E: execução real pós-build (contrato de CLI e códigos de saída)

### Variáveis de Ambiente (Parsing & Falhas)

| Variável                     | Default | Efeito                                                                     |
| ---------------------------- | ------- | -------------------------------------------------------------------------- |
| `PARSE_ERRO_AGRUPAR`         | `true`  | Agrupa múltiplos erros de parsing por arquivo após limite                  |
| `PARSE_ERRO_MAX_POR_ARQUIVO` | `1`     | Qtde máxima antes de condensar em ocorrência agregada                      |
| `PARSE_ERRO_FALHA`           | `false` | Se `true`, presença de parsing errors (após agregação) falha o diagnóstico |

### Dicas de Encoding no Windows

Alguns consoles no Windows podem distorcer bordas/acentos quando você redireciona a saída para arquivo.

- Para forçar molduras ASCII (sem caracteres box-drawing), use a variável de ambiente:
  - PowerShell (escopo da linha):

    ```powershell
    $env:ORACULO_ASCII_FRAMES = '1'; oraculo diagnosticar > out.txt
    ```

  - CMD clássico:

    ```bat
    set ORACULO_ASCII_FRAMES=1 && oraculo diagnosticar > out.txt
    ```

- Alternativamente, ajuste a sessão para UTF-8 (pode variar por ambiente):
  - PowerShell:

    ```powershell
    $OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    ```

  - Prompt de Comando (CMD):

    ```bat
    chcp 65001
    ```

Observação:

- A saída JSON em `--json` já aplica escape `\uXXXX` para caracteres fora do ASCII básico, mitigando problemas ao consumir via pipelines.
- As molduras de seções (headers e tabelas) usam um formatador consciente de ANSI e largura visível e são impressas diretamente (sem prefixos) para preservar bordas. Para forcing ASCII, use `ORACULO_ASCII_FRAMES=1`.

### Métricas Internas (Execução)

Quando `--metricas` (default habilitado) está ativo, o comando `diagnosticar --json` inclui agora dois níveis:

1. Bloco `metricas` original (detalhado por execução) — preservado.
2. Bloco `metricas` agregado simplificado (no root) com razões e top analistas.

Exemplo (trecho simplificado):

```jsonc
{
  "metricas": {
    "totalArquivos": 123,
    "tempoParsingMs": 420,
    "tempoAnaliseMs": 1337,
    "cacheAstHits": 80,
    "cacheAstMiss": 43,
    "analistas": [
      { "nome": "funcoes-longas", "duracaoMs": 12.3, "ocorrencias": 5, "global": false }
    ]
  },
  "linguagens": { ... },
  "estruturaIdentificada": { ... },
  "guardianCacheDiffHits": 4,
  "metricas": {
    "totalArquivos": 123,
    "tempoAnaliseMs": 1337,
    "tempoParsingMs": 420,
    "parsingSobreAnalisePct": 31.42,
    "topAnalistas": [
      { "nome": "funcoes-longas", "duracaoMs": 12.3, "ocorrencias": 5 }
    ]
  }
}
```

O campo `parsingSobreAnalisePct` é derivado (parsing/analise \* 100) e `topAnalistas` limita a 5.

Use `oraculo metricas --json` para histórico agregado e `--export` para salvar snapshot completo (auditorias de performance). A persistência agora fica em `.oraculo/historico-metricas/metricas-historico.json` (ignorado no Git). Em execuções legacy, se esse diretório ainda não existir mas o arquivo antigo `.oraculo/metricas-historico.json` existir, ele será usado automaticamente via fallback de migração. Para limpar todo o histórico basta remover a pasta:

```bash
rm -rf .oraculo/historico-metricas
```

Ou no Windows PowerShell:

```powershell
Remove-Item -Recurse -Force .oraculo/historico-metricas
```

Pode ser adicionado um script npm (`cleanup:metricas`) futuramente se desejado.

Contrato JSON (`diagnosticar --json`) inclui `parseErros.totalOriginais` e `parseErros.agregados` para transparência.

Blocos adicionais:

- `linguagens`: resumo das extensões analisadas ordenadas por frequência.
- `guardianCacheDiffHits`: número de hits do cache de diff intra-processo (otimização Guardian).
- `estruturaIdentificada.melhores[].confidence` e deltas agora apresentados internamente com formatação padronizada (ex: `+92.0%`).

```jsonc
{
  "linguagens": {
    "total": 230,
    "extensoes": { "ts": 120, "js": 40, "kt": 5, "java": 3, "xml": 2 },
  },
}
```

Isso facilita métricas de adoção multi-stack e priorização de analistas dedicados.

### Filtros Pontuais de Arquivos (`--include` / `--exclude`)

Use para um diagnóstico focado (investigar somente uma pasta, ou incluir node_modules pontualmente, ou excluir arquivos de teste). Ambos aceitam:

- Múltiplas ocorrências da mesma flag (`--include a --include b`)
- Lista separada por vírgula (`--include "a,b,c"`)
- Separação por espaços dentro do valor (`--exclude "dist/** docs/**"`)
  Espaços e vírgulas são normalizados e duplicados removidos. Padrões são globs micromatch.

Regras de precedência:

1. Se `--include` estiver presente e não vazio: somente arquivos que casem pelo menos um pattern listado serão considerados (ignora os ignores padrão, ex: permite inspecionar `node_modules`).
2. Em seguida aplica-se `--exclude` (remove qualquer arquivo que casar com algum pattern extra).
3. Se `--include` não for usado: usa ignores padrão e depois aplica `--exclude`.

Exemplos:

```bash
# Incluir apenas arquivos TypeScript e package.json
oraculo diagnosticar --include "src/**/*.ts,package.json"

# Inspecionar apenas node_modules (bypass de ignore padrão) para auditoria pontual
oraculo diagnosticar --include "node_modules/**"

# Incluir somente código de produção e excluir testes
oraculo diagnosticar --include "src/**" --exclude "**/*.test.ts,**/*.spec.ts"

# Múltiplas ocorrências equivalentes a lista combinada
oraculo diagnosticar --include src/core/** --include src/guardian/** --exclude "**/*.test.ts"

# Excluir diretórios de documentação e arquivos de build extras
oraculo diagnosticar --exclude "docs/**,dist/**"

# Combinação: focar em duas pastas específicas e ainda excluir mocks
oraculo diagnosticar --include "src/core/**,src/guardian/**" --exclude "**/mocks/**"
```

Boas práticas:

- Evite listas muito grandes de globs: separe investigações em execuções menores.
- Use `--json` junto quando integrar em scripts (a saída filtrada reduz ruído e volume de dados).
- Para auditorias de dependências, combine com flags silenciosas: `oraculo diagnosticar --include "node_modules/**" --silence --json`.

Limitações atuais:

- Apenas separação por vírgula suportada (futuramente avaliar suporte a repetir `--include`).
- Não há feedback explícito listando padrões aplicados (pode ser adicionado em modo `--verbose`).
- Mesmo com `--scan-only` e `--include`, `node_modules` pode ser ignorado em alguns cenários por guard-rails. Ver detalhes e próximos passos em `docs/DECISOES-ABORDAGEM-SCAN-FILTROS.md`.

Se precisar resetar filtros programaticamente, não passe as flags (elas não persistem em config).

### Exit Codes

| Contexto                                                         | Exit Code |
| ---------------------------------------------------------------- | --------- |
| Execução bem-sucedida (sem erros críticos)                       | 0         |
| Guardian detecta alterações sem política permissiva (`--diff`)   | 1         |
| Falha técnica (ex: parse irreversível + `PARSE_ERRO_FALHA=true`) | 1         |
| Erro estrutural inesperado (IO, crash)                           | 1         |

Durante testes (`process.env.VITEST` definido) não chamamos `process.exit`, permitindo inspeção.

## 📁 Estrutura (Resumo)

```text
src/
  cli.ts                # Entrada principal da CLI
  cli/                  # Comandos individuais
  analistas/            # Núcleo de análise
  arquitetos/           # Diagnóstico e arquitetura
  zeladores/            # Correções e manutenção
  guardian/             # Verificações e baseline
  relatorios/           # Geração de relatórios
  tipos/                # Tipos e interfaces globais
  zeladores/util/       # Helpers utilitários e persistência
tests/
  fixtures/             # Arquivos sintéticos usados só em testes (plugins, exemplos de parsing, etc)
    plugins/            # Plugins de teste carregados em cenários controlados
    arquivos/           # Exemplos genéricos file1.ts / file2.ts movidos da raiz
```

## 🔌 Domínios

- Analistas: identificam padrões, estruturas e potenciais problemas (somente leitura)
- Arquitetos: consolidam diagnósticos de alto nível
- Zeladores: aplicam correções (ex: poda, reestruturação)
- Guardian: verifica integridade (hashes, baseline, diffs)
- Relatórios: geração de artefatos (Markdown / JSON)

## � Analistas (resumo)

- detector-dependencias — heurísticas de dependências e sinais de stack
- detector-estrutura — extração de sinais estruturais globais
- analista-funcoes-longas — funções extensas/complexas
- analista-padroes-uso — padrões de uso agregados do código
- ritual-comando — boas práticas de comandos (handlers nomeados)
- todo-comments — comentários TODO pendentes (agregado por arquivo)

Catálogo completo e detalhes: veja `src/analistas/README.md`.
Para gerar um documento estático do catálogo: `oraculo analistas --doc docs/ANALISTAS.md`.

## �🤝 Contribuir

Leia `CONTRIBUTING.md` e `docs/TOOLING.md`.

## �️ Roadmap & Checklist

`docs/CHECKLIST.md` mantém backlog vivo. Este README não replica listas para evitar divergência.

## 🧬 Camadas de Teste

Resumo rápido em `docs/TOOLING.md` e detalhado em `docs/relatorios/camadas-testes.md`.

## 📑 Agregação de PARSE_ERRO

Para evitar ruído excessivo:

- Por padrão (`PARSE_ERRO_AGRUPAR=true`) múltiplos erros de parsing no mesmo arquivo são consolidados.
- Limite de ocorrências individuais antes de agrupar: `PARSE_ERRO_MAX_POR_ARQUIVO` (default: 1).
- A contagem total original é preservada em `parseErros.totalOriginais` (modo `diagnosticar --json`).
- Campo `agregados` indica quantos foram suprimidos por agrupamento.
- Ajuste via config/env: `PARSE_ERRO_AGRUPAR=false` para listar todos; aumentar `PARSE_ERRO_MAX_POR_ARQUIVO` para tolerar mais entradas antes de condensar.
- Para tornar parsing errors blockers, defina `PARSE_ERRO_FALHA=true` (gate útil em pipelines mais rigorosos).

## 🛡️ Segurança (Plugins & Caminhos)

Medidas atuais:

- Whitelist de extensões para carregamento de plugins (`.js`, `.mjs`, `.cjs`, `.ts`) — evita execução de binários ou formatos arbitrários.
- Sanitização de paths relativos removendo sequências de escape (`../`, `~`) fora da raiz do projeto.
- Validação defensiva de globs: limita número de `**` e padrões potencialmente explosivos (mitiga varreduras custosas).
- Baseline Guardian não pode ser aceita em modo `--full-scan` (evita “fotografar” estado potencialmente inseguro / bypass de ignore temporário).
- Fallback determinístico de hash se algoritmos criptográficos indisponíveis (garante integridade mínima para diff).

Expectativas para contribuições:

- Qualquer novo ponto de carregamento dinâmico deve validar extensão e residir dentro da raiz do repo.
- Evitar `eval` / `Function` dinâmica; se inevitável, justificar em PR.
- Acesso a FS sempre via helpers centralizados (`lerEstado` / `salvarEstado`).

Próximos reforços (sugeridos):

- Lista de blocklist para nomes de plugins comuns maliciosos
- Métrica de tempo por plugin para detectar outliers de performance
- Flag de modo estrito que falha em qualquer plugin com erro

## 📜 Guardian JSON (Resumo)

Quando executado com `--json`, o comando `guardian` retorna objeto com:

```json
{
  "status": "ok" | "baseline-criado" | "baseline-aceito" | "alteracoes-detectadas" | "erro",
  "diff": {
    "adicionados": [],
    "alterados": [],
    "removidos": []
  },
  "politicas": {
    "permiteAdds": true,
    "permiteChanges": true,
    "permiteDeletes": true
  },
  "baselinePath": "./.oraculo/baseline.json",
  "fullScan": false
}
```

Notas:

- Em `fullScan=true` não é permitido aceitar baseline.
- Em caso de erro estrutural/hard (ex: IO), `status: "erro"` e processo sai com código != 0.

---

## 🔐 Pipeline Local vs CI

Para garantir que o que passa localmente também passe no GitHub Actions (Linux):

| Etapa          | Local (VSCode / Git)             | CI (Actions)                          | Observações                                  |
| -------------- | -------------------------------- | ------------------------------------- | -------------------------------------------- |
| Formatação     | Prettier on save / `lint-staged` | `npm run format` (fail on diff)       | Pre-commit impede commit fora do padrão      |
| Lint           | ESLint (formatOnSave fixAll)     | `npm run lint` (warnings permitidos)  | Ajuste regras conforme maturidade            |
| Typecheck      | `npm run typecheck`              | `npm run typecheck`                   | Sem diferenças                               |
| Testes unidade | `npm run test:unit`              | `npm run test:unit` dentro de `check` | E2E separados para velocidade                |
| Testes E2E     | `npm run test:e2e`               | Job dedicado pós build                | Usa binário dist real                        |
| Cobertura      | Opcional local                   | `npm run coverage` + gate             | Gate falha se limiar abaixo                  |
| Segurança deps | `npm audit` (manual)             | `npm run security:deps` (não falha)   | Falhas críticas podem virar hard fail depois |
| Build artefato | `npm run build`                  | Artifact `dist` publicado             | Útil para inspeção / releases                |

### Husky & lint-staged

Hooks configurados:

- `pre-commit`: roda `lint-staged` aplicando Prettier e ESLint somente nos arquivos staged.

Se precisar pular (não recomendado):

```bash
HUSKY=0 git commit -m "chore: bypass hook"
```

### Scripts Principais

```bash
npm run check:style   # lint + prettier check + typecheck
npm run check         # estilo + testes de unidade
npm run test:e2e      # apenas E2E
```

### Variáveis Úteis

- `PARSE_ERRO_FALHA=true` pode ser usado para fazer parse errors agregados falharem o diagnóstico.

---

## 🛡️ Licença e Terceiros

Distribuído sob a licença MIT. Uso comercial, fork, modificação e redistribuição são permitidos.

Avisos de terceiros: este projeto inclui dependências open source cujas licenças e, quando aplicável, textos de licença completos são listados em `THIRD-PARTY-NOTICES.txt` (EN) e `AVISOS-DE-TERCEIROS.pt-BR.txt` (cabeçalho em pt-BR; textos legais mantidos no idioma original).

Como atualizar o arquivo de avisos:

```bash
# Gera/atualiza a versão padrão (EN)
npm run licenses:notice

# Gera/atualiza a versão com cabeçalho em português
npm run licenses:notice:pt-br
```

Isso gera/atualiza os arquivos com base nas dependências de produção instaladas.

### Por que MIT?

- Reduz fricção de adoção em empresas (compliance já conhece o texto padrão)
- Maximiza probabilidade de contribuições externas (licença reconhecida e permissiva)
- Evita ambiguidade de termos subjetivos como “uso comercial” / “revenda”
- Simplifica packaging em registries, distros e automações (SPDX: MIT)
- Permite que qualquer pessoa experimente, derive e integre sem negociar exceções
- Foco do projeto é impacto e comunidade, não captura de valor via restrição

Se surgir necessidade futura de oferecer extras proprietários, dá para fazer via modelo open-core sem alterar o core livre.

## � Agradecimentos

Este projeto se apoia em software livre mantido por uma comunidade incrível.

- Avisos e licenças de terceiros: consulte `THIRD-PARTY-NOTICES.txt` (EN) e `AVISOS-DE-TERCEIROS.pt-BR.txt` (cabeçalho em pt-BR).
- Os textos legais das licenças são reproduzidos no idioma original para preservar a validade jurídica.
- A todas as pessoas mantenedoras e contribuidoras de OSS: obrigado pelo trabalho e pela distribuição aberta que torna este projeto possível.

## �🚀 Performance

Snapshots sintéticos: `npm run perf:baseline` (detalhes em `docs/perf/README.md`).

---

## 🔗 Documentação Adicional

- Guardian: `docs/guardian.md`
- Arquétipos & Reestruturação: `docs/estruturas/README.md`
- Plugins: `docs/plugins/GUIA.md`
- Tooling & Qualidade: `docs/TOOLING.md`
- Performance: `docs/perf/README.md`
- Checklist / Roadmap Ativo: `docs/CHECKLIST.md`
- Camadas de Teste: `docs/relatorios/camadas-testes.md`
- Analistas (técnicas): `src/analistas/README.md`
- Catálogo de Analistas (gerado): `docs/ANALISTAS.md`
- Relatório de Progresso: `docs/relatorios/RELATORIO.md`
- Monitor de Dependências: `docs/MONITOR_DEPENDENCIAS.md`
- Especificações: `docs/specs/ESPECIFICACOES.md`

---

Autor: Italo C Lopes — Licença MIT
