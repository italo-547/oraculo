# Oráculo CLI

[![CI](https://github.com/aynsken/oraculo/actions/workflows/ci.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/ci.yml)
[![Build](https://github.com/aynsken/oraculo/actions/workflows/build.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/build.yml)
[![Monitor Deps](https://github.com/aynsken/oraculo/actions/workflows/monitor-deps.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/monitor-deps.yml)

Oráculo é uma CLI modular para análise, diagnóstico e manutenção de projetos, com arquitetura extensível via plugins e comandos customizados. Focada em segurança evolutiva: alta cobertura de testes, arquitetura segmentada (analistas, arquitetos, zeladores, guardian) e geração de relatórios consistentes.

## 🚀 Visão Geral

- Diagnóstico de padrões, estrutura e saúde de projetos
- Modular: analistas, arquitetos, zeladores, guardian, etc
- Extensível via plugins e comandos
- Tipagem rigorosa (TypeScript ESM)
- Relatórios automatizados

## ⚙️ Requisitos

- Node.js >= 24.x
- npm >= 11.x

## 📦 Instalação

```bash
git clone https://github.com/aynsken/oraculo.git
cd oraculo
npm install
```

## 🖥️ Como usar

### Rodar a CLI (local)

```bash
npm run build
node dist/cli.js <comando>
```

Exemplo:

```bash
node dist/cli.js diagnosticar
node dist/cli.js podar
```

### Fluxo de Desenvolvimento Rápido

```bash
npm run build        # build uma vez
node dist/cli.js diagnosticar

# Ou em modo watch de testes durante desenvolvimento
npm run test:watch
```

### Variável de Ambiente de Teste

Durante a execução dos testes a variável `VITEST=1` (ou já definida pelo runner) evita que a CLI chame `process.exit(...)`, permitindo inspeção de logs sem encerrar o processo. Em uso normal (fora de testes) a CLI poderá encerrar com códigos de saída quando houver erros críticos (ex: ocorrências nível erro ou falha do guardian).

### Flags Globais

Você pode usar as flags globais em qualquer comando para controlar o nível de logs e exportação de relatórios:

| Flag          | Descrição                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------- |
| `--silence`   | Silencia todos os logs de informação e aviso (sobrepõe `--verbose`)                       |
| `--verbose`   | Exibe logs detalhados de cada arquivo e técnica analisada (ignorado se `--silence` ativo) |
| `--export`    | Gera arquivos de relatório detalhados (JSON e Markdown)                                   |
| `--dev`       | Ativa modo de desenvolvimento (logs de debug)                                             |
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

### Plugins

Plugins podem ser carregados (ex: corretores / zeladores) para aplicar transformações. Recomenda-se isolar lógica em módulos ESM e seguir a tipagem definida em `src/tipos/tipos.ts`. Falhas em plugins não interrompem a execução principal: são logadas com nível aviso.

Guia completo de extensões e criação de técnicas: veja `docs/plugins/GUIA.md`.

### Persistência e Helpers

Toda leitura/escrita de estado, snapshots ou relatórios deve usar `lerEstado` / `salvarEstado` em `src/zeladores/util/persistencia.ts`. Nunca use `fs.readFile` / `fs.writeFile` diretamente fora desses helpers. Isso garante consistência, testabilidade e facilidade de evolução.

### Instalação global (opcional)

Se quiser rodar o comando `oraculo` diretamente no terminal, instale globalmente:

```bash
npm install -g .
```

Assim, basta rodar:

```bash
oraculo <comando>
```

### Comandos disponíveis

- `diagnosticar` — Analisa padrões e estrutura do projeto
- `podar` — Remove arquivos órfãos
- `reestruturar` — Corrige estrutura de pastas/arquivos
- `guardian` — Verificações de integridade (baseline, diff de hashes, sentinela)
- Documentação detalhada do Guardian: `docs/guardian.md`
- ...e outros! Veja todos com:

```bash
node dist/cli.js --help
```

## 🧪 Testes

Estado atual: 358 testes passando (data: 2025-08-13). A contagem pode evoluir.

Rodar todos os testes:

```bash
npm test
```

Ver cobertura:

```bash
npx vitest run --coverage
```

### Política de Cobertura (Gate)

Limiar mínimo (enforced em CI/local via `npm run coverage:enforce`):

| Métrica    | Limiar |
| ---------- | ------ |
| Statements | 90%    |
| Lines      | 90%    |
| Branches   | 88%    |
| Functions  | 90%    |

Arquivo de configuração: `package.json` (`vitest.coverage.exclude` + script `coverage:enforce`).

Exclusões justificadas:

- Scripts auxiliares / protótipos fora de `src/` (`scripts/**`, `fora-do-src.js`, placeholders `file1.ts`, `file2.ts`, `tmp-cache-file.ts`)
- Arquivos sintéticos de testes (`tmp-cache-file.ts`) para simular cenários de cache

Critérios para novas exclusões: só se não houver lógica de produção ou forem artefatos sintéticos usados unicamente em testes. Caso contrário, escreva testes.

Processo para elevar limiares: aumentar uma métrica por vez quando o piso real estiver estável ≥ (limiar + 3%). Atualizado agora pois ultrapassamos 90% global (Statements/Lines ~91.3%). Próximo alvo potencial: Branches 90%+ após estabilizar acima de ~89% por alguns commits e reduzir pequenos clusters remanescentes.

Pull Requests devem manter (ou aumentar) cobertura efetiva. Se reduzir, justificar em descrição com plano de recuperação.

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

### Métricas Internas (Execução)

Quando `--metricas` (default habilitado) está ativo, o comando `diagnosticar --json` inclui o bloco `metricas` com:

```jsonc
{
  "metricas": {
    "totalArquivos": 123,
    "tempoParsingMs": 420,
    "tempoAnaliseMs": 1337,
    "cacheAstHits": 80,
    "cacheAstMiss": 43,
    "analistas": [
      { "nome": "funcoes-longas", "duracaoMs": 12.3, "ocorrencias": 5, "global": false },
    ],
  },
}
```

Use `oraculo metricas --json` para histórico agregado e `--export` para salvar snapshot completo (auditorias de performance). A persistência fica em `.oraculo/metricas-historico.json` (ignorado no Git). Desabilite via `--no-metricas` se quiser reduzir overhead mínimo (~1–2ms em bases pequenas).

Contrato JSON (`diagnosticar --json`) inclui `parseErros.totalOriginais` e `parseErros.agregados` para transparência.

### Critério de Exit Codes

| Contexto                                                         | Exit Code |
| ---------------------------------------------------------------- | --------- |
| Execução bem-sucedida (sem erros críticos)                       | 0         |
| Guardian detecta alterações sem política permissiva (`--diff`)   | 1         |
| Falha técnica (ex: parse irreversível + `PARSE_ERRO_FALHA=true`) | 1         |
| Erro estrutural inesperado (IO, crash)                           | 1         |

Durante testes (`process.env.VITEST` definido) não chamamos `process.exit`, permitindo inspeção.

## 📁 Estrutura do Projeto

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
```

## 🔌 Arquitetura Modular (Domínios)

- Analistas: identificam padrões, estruturas e potenciais problemas (somente leitura)
- Arquitetos: consolidam diagnósticos de alto nível
- Zeladores: aplicam correções (ex: poda, reestruturação)
- Guardian: verifica integridade (hashes, baseline, diffs)
- Relatórios: geração de artefatos (Markdown / JSON)

## 🤝 Contribuição

- Siga o padrão de helpers centralizados (`src/zeladores/util/`)
- Use aliases de importação do `tsconfig.json`
- Sempre escreva testes para novos recursos
- Sugestões? Abra uma issue ou PR!

## 📋 Roadmap (recorte ativo)

- [x] Implementar flag `--scan-only`
- [x] Testes ponta-a-ponta executando binário buildado (E2E básicos + guardian + exit code erro)
- [x] Integração contínua com lint + format + coverage gate (CI + build)
- [x] Flags `--json` (diagnosticar/guardian) e `--full-scan` (guardian)
- [x] Métricas de performance básicas exportáveis (JSON + histórico)
- [ ] Baseline comparativa de performance por commit
- [ ] Relatório de baseline de performance automatizado
- [x] Guia de criação de plugins (contrato + exemplo mínimo)
- [ ] Guia de padronização / estilo de código (linters + convenções)

## 🧬 Camadas de Teste (Resumo)

| Camada                | Objetivo                            | Exemplos              |
| --------------------- | ----------------------------------- | --------------------- |
| Unidade               | Validar funções/helpers isolados    | analistas individuais |
| Integração            | Fluxos entre módulos                | inquisidor + executor |
| Guardian/Persistência | Baseline, diff, hash                | `guardian/*`          |
| CLI Commands          | Comportamento de comandos sem build | `comando-*.test.ts`   |
| E2E Binário           | Execução real pós-build             | `e2e-bin.test.ts`     |

### Cenários E2E Atuais

- Modo `--scan-only` (exit 0)
- `--scan-only --export` gera arquivo JSON
- Diagnóstico completo benigno (exit 0)
- Criação de baseline guardian (exit 0)
- Ocorrência com erro técnico gera exit code 1

Detalhes completos em `docs/relatorios/camadas-testes.md`.

## 📑 Agregação de PARSE_ERRO

Para evitar ruído excessivo:

- Por padrão (`PARSE_ERRO_AGRUPAR=true`) múltiplos erros de parsing no mesmo arquivo são consolidados.
- Limite de ocorrências individuais antes de agrupar: `PARSE_ERRO_MAX_POR_ARQUIVO` (default: 1).
- A contagem total original é preservada em `parseErros.totalOriginais` (modo `diagnosticar --json`).
- Campo `agregados` indica quantos foram suprimidos por agrupamento.
- Ajuste via config/env: `PARSE_ERRO_AGRUPAR=false` para listar todos; aumentar `PARSE_ERRO_MAX_POR_ARQUIVO` para tolerar mais entradas antes de condensar.
- Para tornar parsing errors blockers, defina `PARSE_ERRO_FALHA=true` (gate útil em pipelines mais rigorosos).

## 🛡️ Segurança de Plugins & Caminhos

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

## 📜 Guardian JSON (Contrato de Saída)

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

## 🔐 Pipeline Local vs CI (Confiabilidade & Segurança)

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

**Autor:** Italo C Lopes  
**Licença:** MIT

## 🛡️ Licença

Distribuído sob a licença MIT. Uso comercial, fork, modificação e redistribuição são permitidos. Atribuição é bem-vinda, mas não obrigatória.

### Por que MIT?

- Reduz fricção de adoção em empresas (compliance já conhece o texto padrão)
- Maximiza probabilidade de contribuições externas (licença reconhecida e permissiva)
- Evita ambiguidade de termos subjetivos como “uso comercial” / “revenda”
- Simplifica packaging em registries, distros e automações (SPDX: MIT)
- Permite que qualquer pessoa experimente, derive e integre sem negociar exceções
- Foco do projeto é impacto e comunidade, não captura de valor via restrição

Se surgir necessidade futura de oferecer extras proprietários, dá para fazer via modelo open-core sem alterar o core livre.

## 🚀 Performance (Baseline Inicial)

Rode `npm run perf:baseline` para gerar snapshot sintético em `docs/perf/` contendo:

- Tempo de parsing vs análise total
- Contagem de arquivos e tamanhos agregados
- Duração por analista (quando métricas habilitadas)
- Versão Node e commit

Em breve: comparação automática e alerta de regressões.

---

Notas rápidas de manutenção:

- Evite duplicar lógica de persistência
- Prefira funções puras para analistas e relatórios
- Use aliases sempre (ex: `@nucleo/*`) em vez de caminhos relativos longos
- Mantenha testes alinhados a contratos claros (evitar mocks frágeis)
