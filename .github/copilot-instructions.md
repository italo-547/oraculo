> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

## Helpers Utilitários e Persistência de Estado

Para evitar duplicidade e facilitar manutenção, **todas as funções auxiliares recorrentes** (persistência, manipulação de pendências, leitura/escrita de estado, etc.) devem ser centralizadas em arquivos utilitários, preferencialmente em `src/zeladores/util/`.

### Padrão de Persistência (obrigatório)

Utilize sempre os helpers `lerEstado` e `salvarEstado` para qualquer leitura ou escrita de arquivos de estado, JSON, relatórios ou snapshots. **Não use `fs.readFile` ou `fs.writeFile` diretamente fora desses helpers**.

#### Exemplo real:

```ts
// src/zeladores/util/persistencia.ts
import { promises as fs } from 'node:fs';

export async function lerEstado<T = any>(caminho: string): Promise<T> {
  try {
    const conteudo = await fs.readFile(caminho, 'utf-8');
    return JSON.parse(conteudo);
  } catch {
    return [] as any;
  }
}

export async function salvarEstado<T = any>(caminho: string, dados: T): Promise<void> {
  await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}
```

#### Uso correto em outros módulos:

```ts
// src/guardian/registros.ts
import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';

// ...
await salvarEstado(destino, registros);
const registros = await lerEstado<RegistroIntegridade[]>(caminho);
```

```ts
// src/relatorios/relatorio-poda.ts
import { salvarEstado } from '../zeladores/util/persistencia.js';

await salvarEstado(caminho, md); // para markdown
await salvarEstado(caminho, json); // para json
```

### Dicas e Boas Práticas

- Sempre documente helpers utilitários criados.
- Prefira helpers puros e sem efeitos colaterais, facilitando testes e manutenção.
- Se helpers crescerem, mova para um módulo utilitário dedicado e registre o padrão neste arquivo.
- **Nunca** duplique lógica de persistência em múltiplos arquivos.
- Para manipulação de pendências, relatórios ou snapshots, sempre use os helpers centralizados.

---

# Copilot Instructions for Oráculo CLI

## Hardening + Proveniência

Estas diretrizes reforçam originalidade, licenças, privacidade e segurança operacional.

### Configuração do Copilot e Política de Originalidade

- Ative: “Bloquear sugestões que correspondam a código público” (quando disponível).
- Revise sugestões para evitar trechos idênticos/substancialmente semelhantes a código público.
- Prefira soluções autorais a partir de princípios; não copie de blogs, SO ou repositórios.
- Para algoritmos clássicos, implemente a partir da especificação, não de uma implementação pública.
- Evite inserir blocos longos (>20 linhas) de uma única fonte pública.
- Referencie documentação oficial somente na descrição do PR; não copie trechos integrais para o código.

### Licença, Dependências e Conformidade

- Repo sob MIT: gere apenas conteúdo compatível (preferência MIT/Apache-2.0/BSD).
- Evite copyleft forte (GPL/AGPL/LGPL); qualquer exceção deve ser justificada no PR.
- Não “vendorize” código de terceiros; use gerenciadores de pacotes.
- Mantenha o inventário de terceiros atualizado (THIRD-PARTY-NOTICES).

### Privacidade, Segredos e Dados

- Nunca inclua tokens/chaves/credenciais em código, exemplos, commits, issues ou PRs.
- Use placeholders e variáveis de ambiente para segredos.
- Não cole conteúdo de repositórios privados ou documentos internos.
- Exemplos devem ser originais; se derivados, reescreva e cite o link no PR.

### Diretrizes de Engenharia Segura

- Não use eval/Function dinâmica nem desabilite checks de tipo para contornar erros.
- Valide e sanitize entradas; limite tamanho/escopo de entradas e recursos.
- Evite injeção de comando; prefira spawn com shell: false e argumentos como lista.
- Padrões seguros por padrão (TLS/HTTPS, headers, cookies HttpOnly/SameSite quando aplicável).
- Não ampliar CORS ou permissões além do necessário.
- Registre “notas de risco” para alterações em authZ/authN, criptografia, segredos ou superfícies de rede.

## Visão Geral

Este projeto é uma CLI modular para análise, diagnóstico e manutenção de projetos, organizada em múltiplos domínios (analistas, arquitetos, zeladores, guardian, etc). O código é escrito em TypeScript ESM puro, com tipagem rigorosa e uso extensivo de aliases de importação.

## Estrutura Principal

- `src/cli.ts`: Entrada principal da CLI.
- `src/cli/`: Comandos individuais (ex: `comando-diagnosticar.ts`, `comando-podar.ts`).
- `src/analistas/`, `src/arquitetos/`, `src/zeladores/`, `src/guardian/`: Núcleos de lógica para análise, diagnóstico, correção e verificação.
- `src/nucleo/`: Funções centrais de execução, parsing, scanner e utilidades globais.
- `src/relatorios/`: Geração e estruturação de relatórios (sempre via helpers centralizados).
- `src/tipos/tipos.ts`: Tipos e interfaces compartilhados.
- `src/zeladores/util/`: Helpers utilitários e persistência de estado.

## Convenções e Padrões

- **Helpers centralizados**: Persistência, manipulação de pendências e relatórios sempre via helpers em `src/zeladores/util/`.
- **Aliases de importação**: Use `@nucleo/*`, `@analistas/*`, etc, conforme definido em `tsconfig.json`.
- **Tipagem**: Sempre utilize tipos definidos em `src/tipos/tipos.ts`.
- **Modularização**: Cada domínio tem arquivos e funções bem separados.
- **ESM puro**: Não use `require`; apenas `import`/`export`.
- **Sem comentários removidos**: `removeComments: false` no build.
- **Molduras (blocos multi-linha)**: Sempre gere o texto do bloco com `formatarBloco` (exposto via `log.bloco`) e imprima o resultado diretamente com `console.log(bloco)`. Não use `log.info/aviso/...` para imprimir linhas do bloco, pois os prefixos (timestamp/nível) quebram o alinhamento das bordas.

Exemplo:

```ts
import { log } from '@nucleo/constelacao/log';

const linhas = [
  'Tipo                   Quantidade',
  '---------------------  ----------',
  'TODO_PENDENTE           214',
];
const bloco = (log as unknown as { bloco: Function }).bloco(
  'Resumo dos tipos de problemas',
  linhas,
);
console.log(bloco); // impressão direta, sem prefixo
```

## Fluxos de Trabalho

- **Build**: Use o TypeScript com as opções do `tsconfig.json`. Saída em `dist/`.
- **Execução CLI**: Rode comandos via `node dist/cli.js <comando>` após build.
- **Aliases**: Sempre importe módulos usando os aliases do `tsconfig.json`.
- **Testes**: Já implementados (Vitest). Durante testes `process.env.VITEST` deve impedir chamadas a `process.exit`.
- **Persistência**: Sempre utilize os helpers centralizados para leitura/escrita de arquivos de estado, relatórios e snapshots.
- **Branches**: `develop` é a branch padrão para desenvolvimento; `main` é protegida e recebe merge via PR + checks do CI.
- **Pré-visualização**: `npm run pre-public` monta a pasta `pre-public/` com artefatos que seriam publicados (sem publicar nada).
- **Release manual**: Workflow `release-prepublic` (Actions → workflow_dispatch) cria um Release draft anexando `pre-public.zip` para a tag informada.

## Cobertura e Testes (Vitest)

- Limiares atuais (V8): linhas/declarações/funções 90% e ramos 88% no projeto. Evite regressões e, quando possível, mantenha ≥ 90% também para ramos nos arquivos críticos de CLI (ex.: `src/cli/comando-diagnosticar.ts`).
- Priorização de ramos: adicione micro-testes que acionem early-returns (`--scan-only`), caminhos de erro/catch, e combinações de flags que mudam o fluxo (verbose, compacto, guardian full-scan, exportações de relatório).
- Execução em testes: durante Vitest, `process.env.VITEST` deve desabilitar saídas que encerram o processo. Use spies em `process.exit` e restaure no teardown.
- Mocks úteis: isole formatação de terminal (chalk/width), IO (helpers de persistência), e relógio quando necessário. Não faça mock de `fs` direto: sempre dos helpers (`lerEstado`/`salvarEstado`).
- Estabilidade: evite flakiness controlando flags/ambiente explicitamente nos testes (ex.: `COMPACT_MODE`, `VERBOSE`, `SCAN_ONLY`).

## Flags Recentes / Comportamentos

- `--scan-only`: Executa somente varredura + priorização (sem técnicas mutáveis).
- `--full-scan` (guardian): Ignora padrões de ignore para inspeção pontual (não persiste baseline).
- `--json`: Saída estruturada em `diagnosticar` e `guardian` (consumível por CI/pipelines).

### Saída JSON e política de logs

- Em modo `--json`, silencie logs verbosos durante a montagem do objeto e emita apenas o JSON final; restaure o estado do logger após imprimir.
- Escapes Unicode: toda saída JSON deve escapar caracteres fora de ASCII básico via `\uXXXX`. Garanta cobertura para:
  - BMP não-ASCII (acentos, símbolos).
  - Pares substitutos para caracteres fora do BMP (ex.: emojis) — representados como dois `\uXXXX` válidos.
  - Caminhos de fallback quando o code point não for identificável (ex.: `cp == null`) — sempre retorne escape seguro.
- Guardian no JSON: quando o Guardian não for executado, retorne status padrão coerente (ex.: `"nao-verificado"`) e mantenha o shape estável para consumidores.

## Linguagens / Parsing Suportado

Parsing primário (AST Babel completo): `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`.

Parsing leve / heurístico (AST mínimo compat e extra em `oraculoExtra`):

- Kotlin: `.kt`, `.kts` (extração de símbolos `class|object|fun`).
- Java: `.java` (usa `java-parser`).
- XML: `.xml` (fast-xml-parser).
- HTML: `.html`, `.htm` (htmlparser2 DOM -> wrapper).
- CSS: `.css` (css-tree AST).
- Gradle (Groovy/KTS): `.gradle`, `.gradle.kts` (regex heurística para plugins e deps).

Limitação: Analistas que dependem de nós Babel só atuam em linguagens suportadas pelo Babel. Outros arquivos ficam disponíveis para futuros analistas específicos via `oraculoExtra`.

## Saída JSON (`diagnosticar --json`)

Campo `estruturaIdentificada` agora inclui:

- `melhores`: lista de arquétipos candidatos.
- `baseline`: snapshot salvo.
- `drift`: mudanças (alterouArquetipo, deltaConfidence, arquivos raiz novos/removidos).

Campo raiz adicional:

- `linguagens`: resumo agregando extensões analisadas (ex: `{ "total": 230, "extensoes": { "ts": 120, "js": 40, "kt": 5, ... } }`). Ordenado por quantidade desc. Útil para métricas de adoção multi-stack e futura decisão de analistas específicos.

Notas de encoding:

- A saída JSON aplica escape unicode (`\uXXXX`) para caracteres fora de ASCII básico quando `--json` é usado, mitigando artefatos de console Windows legado.
- Inclui suporte a pares substitutos (caracteres fora do BMP) e caminhos de fallback seguros quando o ponto de código não puder ser determinado.

## Agregação de PARSE_ERRO

Para reduzir ruído:

- Erros de parsing por arquivo podem ser agregados após limite configurável (`PARSE_ERRO_MAX_POR_ARQUIVO`).
- Contagem total original é preservada em campo interno (`__ORACULO_PARSE_ERROS_ORIG_TOTAL__`).
- Objetivo: permitir análise de tendência sem inundar logs.
- Próximo passo: expor limites e política no README.

Observações de testes:

- Cubra a agregação com casos-limite garantindo que o limite por arquivo é respeitado e que a contagem total preservada é reportada no campo interno.

## Documentação — Fonte Única de Verdade

- Roadmap operacional agora vive no `docs/CHECKLIST.md` (evitar múltiplos roadmaps divergentes).
- Documentos removidos: `ROADMAP_ITERACOES.md`, `SUGESTOES-PRIORITARIAS.md`, `JSDOC.md` raiz (duplicado).
- Guardian detalhado em `docs/guardian.md`.
- Test layers em `docs/relatorios/camadas-testes.md`.
- Performance baseline em `docs/perf/README.md`.

Qualquer novo documento estratégico deve ser referenciado no CHECKLIST para rastreabilidade.

## Exemplos de Uso de Alias

```ts
import { executar } from '@nucleo/executor';
import { analisarPadroes } from '@analistas/analista-padroes-uso';
```

## Decisões Arquiteturais

- Separação clara entre análise (analistas), diagnóstico (arquitetos), correção (zeladores) e verificação (guardian).
- Relatórios e persistência de estado sempre via helpers centralizados.
- Tipos centralizados para garantir consistência entre domínios.

### Molduras e largura de exibição

- Gere molduras multi-linha com `formatarBloco` via `log.bloco` e imprima com `console.log(bloco)` para preservar bordas/alinhamento.
- Largura: use o cálculo dinâmico; se falhar, aplique fallbacks determinísticos — modo compacto: 84 colunas; modo padrão: 96 colunas. Em ambientes de DEV/CI onde `chalk.columns` não está disponível, trate exceções e caia no fallback.
- Logs verbosos de filtros (include/exclude) não devem quebrar molduras; em `--json` devem estar silenciados.

## Dependências e Requisitos

- Node.js 24.0.4
- TypeScript (veja `tsconfig.json` para detalhes)
- Vitest para testes unitários
- Monitoramento de dependências recomendado (ex: dependabot, npm-check-updates)

## Organização de Documentação

- Toda documentação e relatórios devem ser centralizados na pasta `docs/` na raiz do projeto.
- Relatórios, históricos e arquivos de referência devem ser movidos para `docs/`.
- Exemplos: `docs/RELATORIO.md`, `docs/CHECKLIST.md`.

## Checklist de Melhorias

- Use e atualize sempre o arquivo `docs/CHECKLIST.md` para registrar pendências, melhorias e histórico de ajustes.
- Sempre consulte o checklist antes e depois de cada modificação relevante.

## Referências

- Veja `docs/RELATORIO.md` para histórico de refatorações e decisões recentes.
- Consulte `tsconfig.json` para detalhes de build e aliases.
- Consulte `src/zeladores/util/persistencia.ts` para padrão de helpers de persistência.
- Veja `docs/relatorios/RELATORIO.md` para status atual (ex: contagem de testes).

---

---

Se encontrar padrões não documentados ou dúvidas sobre fluxos, registre exemplos neste arquivo para evoluir as instruções.

## Novas Diretrizes (2025-08-16)

### Testes de Fixtures por Arquétipo

- Crie diretórios de fixtures em `tests/fixtures/estruturas/` para testar detecção de arquétipos.
- Adicione casos híbridos e de conflito de confiança.
- Testes devem simular a execução do motor heurístico e validar a identificação correta dos arquétipos.

### Testes de Combinações de Comandos/Options

- Teste todas as principais combinações de comandos e options da CLI.
- Garanta cobertura para casos que quebram ou geram warnings, criando issues para cada falha.
- Use mocks/spies para validar logs e outputs.

### Refatoração do comando-diagnosticar.ts

- Separe options em arquivo dedicado (`src/cli/options-diagnosticar.ts`).
- Modularize fases do comando em funções menores, facilitando manutenção e testes.

### Registro de Datas

- Sempre registre data de finalização ao marcar um item como concluído no `CHECKLIST.md`.
- No `copilot-instructions.md`, registre data da última atualização das diretrizes.

---

**Última atualização das diretrizes: 2025-08-17**

---
