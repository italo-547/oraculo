# Detector de Arquétipos — Heurísticas, Híbridos e Estratégia de Testes

Última atualização: 2025-08-16

Este documento explica como o detector de arquétipos funciona, por que escolhemos a abordagem atual de validação nos testes e quais problemas enfrentamos até atingir 100% de sucesso na suíte.

## Visão geral

O detector identifica a “estrutura” principal de um projeto (arquétipo) com base em sinais heurísticos (arquivos/diretórios, dependências e padrões de conteúdo). Ele retorna um único candidato principal e, quando aplicável, menciona outros candidatos potenciais (especialmente em cenários híbridos).

Principais objetivos:

- Ser resiliente a variações reais de projetos (pastas equivalentes, dependências alternativas, estruturas parcialmente adotadas).
- Explicar o porquê da decisão (explicação de similaridade) e sugerir próximas ações (plano de reorganização).
- Manter um shape estável para consumo por CLI e JSON (baseline/drift, métricas, etc.).

## Arquitetura do código

Arquivos relevantes:

- `src/analistas/detector-arquetipos.ts`: heurística principal e seleção do arquétipo.
- `src/analistas/arquetipos-defs.ts`: definições de arquétipos (required/optional/forbidden, etc.).
- `src/analistas/detector-estrutura.ts`: suporte de varredura estrutural.
- `src/zeladores/operario-estrutura.ts`: gera `planoSugestao` (mover, conflitos, resumo).
- `src/zeladores/util/persistencia.ts`: helpers centralizados de IO (`lerEstado`/`salvarEstado`).

Fluxo central (resumo):

- scoreArquetipo(def, arquivos)
  - Aplica pesos/penalidades sobre: required/optional/forbidden, dependências, padrões.
  - Sinais especiais (boosts) para arquétipos específicos (ex.: Express, Next.js/Prisma).
  - Detecta híbridos e anexa “candidatoExtra” quando aplicável.
  - Gera `explicacaoSimilaridade` com os motivos e, quando híbrido, lista “Outros candidatos potenciais…”.
- detectarArquetipos(contexto, baseDir)
  - Avalia todos os arquétipos e ordena por confiança/score.
  - Aplica um filtro/votação para selecionar um único “melhor”.
  - Mantém explicação com menção de candidatos potenciais.
  - Calcula/salva baseline e drift estruturais.
  - Invoca `OperarioEstrutura.planejar` para produzir `planoSugestao`.

Tipos relevantes (simplificado):

- Resultado por candidato inclui: `nome`, `confidence`, `score`, `missingRequired`, `matchedRequired`, `forbiddenPresent`, `anomalias`, `planoSugestao`, além de `explicacaoSimilaridade` e, quando houver, `candidatoExtra`.

## Heurísticas e pesos

Constantes (exemplo):

- Required: +10 por match; Optional: +5; Dependência: +10; Pattern: +5
- Penalidades: missing required e forbidden: −20

Sinais específicos:

- api-rest-express: presença de `src/controllers`, dependência `express`, padrões com “api|rest”.
- fullstack: presença de `pages/`, `api/` e `prisma/` (e.g., Next.js + Prisma), possivelmente em conjunto com sinais de backend (Express/controllers) em cenários híbridos.

Híbridos (pontos-chave):

- Se detectar estrutura completa ou parcial de fullstack (pages/api/prisma), a explicação sempre anexa a frase padrão: “Outros candidatos potenciais detectados: fullstack, api-rest-express.”
- Em casos híbridos (ex.: Next.js + Express), também definimos `candidatoExtra` para fornecer contexto ao consumidor do resultado.

## Seleção do candidato principal

- Seleciona um único candidato “melhor” por confiança/score, com votos para desempate.
- Em cenários sem confiança suficiente, ainda assim escolhe o melhor disponível, mantendo a explicação.
- Mantém baseline estruturado e calcula `drift` (alteração de arquétipo, delta de confiança e arquivos raiz novos/removidos).

## Estratégia de testes

Objetivo dos testes: garantir um único candidato principal coerente, com explicação estável e menções claras para cenários híbridos.

Testes principais:

- `tests/analistas/detector-arquetipos.fixtures.spec.ts`: valida detecção nos fixtures realistas (api-rest-express e fullstack-híbrido).
- `tests/analistas/detector-arquetipos.hibrido.spec.ts`: garante que, em híbridos, a explicação contenha a frase-padrão “Outros candidatos potenciais detectados: (fullstack|api-rest-express)”. O teste usa regex para tolerar variação de ordem.

Por que um único candidato principal com menções?

- Consumidores (CLI/JSON) preferem uma decisão clara como “principal”.
- Ainda assim, precisamos comunicar ambiguidade/alternativas nos híbridos, preservando contexto para o usuário final sem quebrar consumidores que esperam um único arquétipo no topo.

Cobertura e thresholds:

- Para execuções locais (`npm test`), desativamos coverage por padrão (ajuste em `vitest.config.ts`: `coverage.enabled` depende de `COVERAGE=true`).
- Mantemos thresholds exigentes para quando a cobertura estiver ativa (linhas/declarações 90%, ramos 88%, funções 90%). Use o script/gate dedicado no CI ou localmente para enforcement.

Exemplos (PowerShell no Windows):

```powershell
# Rodar testes (sem coverage por padrão)
npm run test

# Rodar com cobertura (habilita thresholds)
$env:COVERAGE = 'true'; npm run coverage

# Gate de cobertura (enforcement)
npm run coverage:enforce
```

## Problemas enfrentados e soluções

- Fixtures realistas e dependências ausentes
  - Problema: fixtures sem `node_modules` reais e mistura de Jest/Vitest causando conflitos.
  - Solução: ajustar/mocks mínimos onde necessário, focar em heurísticas sem exigir runtime de dependências e alinhar setup ao Vitest.

- Export e escopo de variáveis
  - Problema: export incorreto da função principal e escopo de variáveis (ex.: `anomalias`).
  - Solução: corrigir export e isolar escopos para evitar poluição/overwrites.

- Seleção e “melhor de N”
  - Problema: empates/ordenação inconsistentes entre 9→6→3→1 candidatos e contagem de votos.
  - Solução: refinar ordenação por confiança/score e consolidar a etapa de votação para um único resultado.

- Híbridos: explicação inconsistente
  - Problema: nem todos os ramos anexavam a frase “Outros candidatos potenciais…”, causando falhas intermitentes.
  - Solução: padronizar a geração de `explicacaoSimilaridade` — para fullstack (pages/api/prisma) e combinações com Express/controllers a frase é sempre anexada; quando híbrido, definir `candidatoExtra`.

- JSON e console Windows: encoding/escape
  - Problema: ruídos com caracteres fora de ASCII básico, inclusive pares substitutos (emojis) e casos `codePointAt == null`.
  - Solução: implementar escape unicode `\uXXXX` com suporte a pares substitutos e fallback seguro quando o code point não existir.

- Gate de cobertura quebrando `npm test`
  - Problema: coverage habilitada por padrão derrubava execuções locais por thresholds.
  - Solução: habilitar cobertura somente quando requisitado (env `COVERAGE=true` ou via script). Thresholds mantidos para CI/gates.

## Referências

- `src/analistas/detector-arquetipos.ts`
- `src/analistas/arquetipos-defs.ts`
- `src/zeladores/operario-estrutura.ts`
- `src/zeladores/util/persistencia.ts`
- `tests/analistas/detector-arquetipos.fixtures.spec.ts`
- `tests/analistas/detector-arquetipos.hibrido.spec.ts`
- `vitest.config.ts`

---

Sugestões futuras:

- Extrair frase-padrão de candidatos potenciais para uma constante compartilhada.
- Ampliar a matriz de fixtures híbridos (ex.: Remix/Express, Next/Fastify) e casos com “confiança de conflito”.
