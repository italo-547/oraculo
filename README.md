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

````bash
git clone https://github.com/aynsken/oraculo.git
cd oraculo
npm install
```bash

## 🖥️ Como usar

### Rodar a CLI (local)

```bash
npm run build
node dist/cli.js <comando>
````

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

Estado atual: 309 testes passando (data: 2025-08-12). A contagem pode evoluir.

Rodar todos os testes:

```bash
npm test
```

Ver cobertura:

```bash
npx vitest run --coverage
```

## 📁 Estrutura do Projeto

```
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
- [ ] Métricas de performance (scan grande / memória) exportáveis
- [ ] Baseline comparativa de performance por commit
- [ ] Relatório de baseline de performance automatizado
- [ ] Guia de criação de plugins (contrato + exemplo mínimo) (in progress)
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
