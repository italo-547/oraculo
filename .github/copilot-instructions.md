> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

## Helpers Utilitários e Persistência de Estado

Para evitar duplicidade e facilitar manutenção, **todas as funções auxiliares recorrentes** (persistência, manipulação de pendências, leitura/escrita de estado, etc.) devem ser centralizadas em arquivos utilitários, preferencialmente em `src/zeladores/util/`.

### Padrão de Persistência (obrigatório)

Utilize sempre os helpers `lerEstado` e `salvarEstado` para qualquer leitura ou escrita de arquivos de estado, JSON, relatórios ou snapshots. **Não use `fs.readFile` ou `fs.writeFile` diretamente fora desses helpers**.

#### Exemplo real:

````ts
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
```ts

#### Uso correto em outros módulos:

```ts
// src/guardian/registros.ts
import { salvarEstado, lerEstado } from '../zeladores/util/persistencia.js';

// ...
await salvarEstado(destino, registros);
const registros = await lerEstado<RegistroIntegridade[]>(caminho);
````

````ts
// src/relatorios/relatorio-poda.ts
import { salvarEstado } from '../zeladores/util/persistencia.js';

await salvarEstado(caminho, md); // para markdown
await salvarEstado(caminho, json); // para json
```ts

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
- Idioma: produza respostas e textos em português brasileiro por padrão. Exceções: quando citar textos jurídicos/licenças ou trechos legais que devem permanecer no idioma original, mantenha o idioma original sem traduzir o conteúdo normativo.

### Licença, Dependências e Conformidade

- Repo sob MIT: gere apenas conteúdo compatível (preferência MIT/Apache-2.0/BSD).
- Evite copyleft forte (GPL/AGPL/LGPL); qualquer exceção deve ser justificada no PR.
- Não “vendorize” código de terceiros; use gerenciadores de pacotes.
- Mantenha o inventário de terceiros atualizado (THIRD-PARTY-NOTICES).

### Política de dependências (obrigatório)

- Objetivo: garantir que o código do repositório e suas dependências sejam compatíveis com a licença MIT e com a política de distribuição do Oráculo.
- Licenças permitidas por padrão: MIT, Apache-2.0, BSD-family (2-clause/3-clause). Preferir pacotes com SPDX identificável.
- Licenças proibidas sem aprovação explícita: GPL, AGPL, LGPL, e outras licenças copyleft forte. Qualquer uso dessas dependências exigirá aprovação por escrito de um mantenedor (PR com justificativa clara e alternativa comercial/ jurídica aprovada).
- Processo para adicionar uma nova dependência:
  - Abra um PR que inclua: nome/versão da dependência, licença SPDX, razão técnica para escolha, e alternativas avaliadas.
  - Adicione um trecho em `docs/CHECKLIST.md` (entrada curta) registrando a decisão e a data.
  - O PR deve acionar o workflow de verificação de licenças (`.github/workflows/license-gate.yml`) e só poderá ser mergeado se a verificação passar ou se houver exceção aprovada por mantenedor.
- Ferramentas e verificações recomendadas (executadas no CI):
  - Escaneamento de licença (ex.: license-checker, oss-review-tool, ou a ação de license-gate já configurada).
  - Atualização automática de `THIRD-PARTY-NOTICES.txt` quando dependências forem adicionadas/atualizadas.
- Proibição de vendorizar: não copie/cole código de terceiros no tree de `src/`; use dependências via package manager. Exceções documentadas somente após revisão de licença.
- Política de pinagem: versionamento mínimo (sem ranges amplos) preferencialmente com `package-lock.json` mantido no repositório para reprodutibilidade do Actions.

Notes de compliance:

- O workflow `.github/workflows/license-gate.yml` deve barrar merges que introduzam dependências incompatíveis; mantenedores podem solicitar auditoria adicional.
- Mantenha `docs/` como fonte autoritativa de políticas; atualize `docs/CHECKLIST.md` sempre que uma exceção ou política nova for tomada.

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

**Versão Atual: 0.2.0** (atualizado em 2025-08-29)

### Novas Funcionalidades v0.2.0

- **⚡ Pool de Workers**: Paralelização automática com Worker Threads para projetos grandes
- **🏷️ Schema Versioning**: Versionamento automático de relatórios JSON com compatibilidade backward
- **🧠 Sistema de Pontuação Adaptativa**: Pontuação inteligente baseada no tamanho do projeto
- **🔧 Correção Crítica**: Exclusão automática otimizada de `node_modules` e outros diretórios
- **📊 Métricas Expandidas**: Estatísticas detalhadas de performance e processamento

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
````

## Fluxos de Trabalho

- **Build**: Use o TypeScript com as opções do `tsconfig.json`. Saída em `dist/`.
- **Execução CLI**: Rode comandos via `node dist/bin/index.js <comando>` após build.
- **Aliases**: Sempre importe módulos usando os aliases do `tsconfig.json`.
- **Testes**: Já implementados (Vitest). Durante testes `process.env.VITEST` deve impedir chamadas a `process.exit`.
- **Persistência**: Sempre utilize os helpers centralizados para leitura/escrita de arquivos de estado, relatórios e snapshots.
- **Branches**: `develop` é a branch padrão para desenvolvimento; `main` é protegida e recebe merge via PR + checks do CI.
- **Pré-visualização**: `npm run pre-public` monta a pasta `preview-oraculo/` com artefatos que seriam publicados (sem publicar nada). O script inclui automaticamente:
  - Build compilado (`dist/`)
  - Documentação completa (`docs/`)
  - Arquivos de configuração (`oraculo.config.json`, `oraculo.config.safe.json`, `tsconfig.json`, `tsconfig.eslint.json`)
  - Metadados do projeto (`package.json`, `README.md`, `LICENSE`, etc.)
  - Avisos de proveniência inseridos automaticamente nos arquivos Markdown
- **Release manual**: Workflow `release-prepublic` (Actions → workflow_dispatch) cria um Release draft anexando `pre-public.zip` para a tag informada.

## Cobertura e Testes (Vitest)

- Limiares atuais (V8): linhas/declarações/funções/ramos 100% no projeto (gate global). Evite regressões; priorize cobrir early-returns (`--scan-only`), caminhos de erro/catch e combinações de flags que mudam o fluxo. Para arquivos críticos de CLI (ex.: `src/cli/comando-diagnosticar.ts`), mantenha 100% em todos os critérios.
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

### Novas métricas v0.2.0

A partir da versão 0.2.0, o relatório JSON inclui métricas expandidas:

````json
{
  "metricas": {
    "workerPool": {
      "workersAtivos": 4,
      "erros": 0,
      "duracaoTotalMs": 890
    },
    "schemaVersion": "1.0.0",
    "pontuacaoAdaptativa": {
      "fatorEscala": 2.5,
      "modo": "padrao",
      "bonusFramework": 1.05
    }
  }
}
```ts

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
- Documentos legados foram movidos para `docs/legado/` com stubs de redirecionamento nos caminhos originais (inclusive no pacote de preview em `preview-oraculo/docs/legado/`): `ROADMAP_ITERACOES.md`, `SUGESTOES-PRIORITARIAS.md`, `JSDOC.md` (raiz/preview).
- Guardian detalhado em `docs/guardian.md`.
- Test layers em `docs/relatorios/camadas-testes.md`.
- Performance baseline em `docs/perf/README.md`.

Qualquer novo documento estratégico deve ser referenciado no CHECKLIST para rastreabilidade.

## Exemplos de Uso de Alias

```ts
import { executar } from '@nucleo/executor';
import { analisarPadroes } from '@analistas/analista-padroes-uso';
````

## Decisões Arquiteturais

- Separação clara entre análise (analistas), diagnóstico (arquitetos), correção (zeladores) e verificação (guardian).
- Relatórios e persistência de estado sempre via helpers centralizados.
- Tipos centralizados para garantir consistência entre domínios.

### Molduras e largura de exibição

- Gere molduras multi-linha com `formatarBloco` via `log.bloco` e imprima com `console.log(bloco)` para preservar bordas/alinhamento.
- Largura: use o cálculo dinâmico; se falhar, aplique fallbacks determinísticos — modo compacto: 84 colunas; modo padrão: 96 colunas. Em ambientes de DEV/CI onde `chalk.columns` não está disponível, trate exceções e caia no fallback.
- Logs verbosos de filtros (include/exclude) não devem quebrar molduras; em `--json` devem estar silenciados.

### Filtros de varredura: include/exclude e node_modules (2025-08-22)

- Grupos de include: dentro do grupo é AND; entre grupos é OR.
- Precedência: include tem prioridade sobre exclude e ignores padrão.
- `node_modules`: ignorado por padrão; ao incluir explicitamente (ex.: `--include node_modules`), deve ser varrido inclusive em `--scan-only`.
- Normalização de caminhos: padronize internamente para POSIX e aceite separadores do Windows na entrada.
- Analistas devem operar apenas sobre o conjunto filtrado pelo scanner/CLI (evitar filtros de diretório hardcoded nos analistas).

## Dependências e Requisitos

- Node.js 24.0.4
- TypeScript (veja `tsconfig.json` para detalhes)
- Vitest para testes unitários
- Monitoramento de dependências recomendado (ex: dependabot, npm-check-updates)

## Organização de Documentação

- Toda documentação e relatórios devem ser centralizados na pasta `docs/` na raiz do projeto.
- Relatórios, históricos e arquivos de referência devem ser movidos para `docs/`.
- Documentos obsoletos/duplicados devem ser arquivados em `docs/legado/` e, quando existirem em caminhos antigos, manter apenas um stub que aponta para `docs/legado/`.
- O pacote de preview segue a mesma política em `preview-oraculo/docs/legado/`.
- Exemplos: `docs/RELATORIO.md`, `docs/CHECKLIST.md`, `docs/NOVAS-FUNCIONALIDADES-v0.2.0.md`.

## Checklist de Melhorias

- Use e atualize sempre o arquivo `docs/CHECKLIST.md` para registrar pendências, melhorias e histórico de ajustes.
- Sempre consulte o checklist antes e depois de cada modificação relevante.

## Árvore estrutural do projeto (modelo obrigatório)

Abaixo segue a árvore estrutural que deve ser seguida como referência padrão do projeto Oráculo. Ela serve como mapa para evitar confusão na organização de código, técnicas e testes. Ao criar novos artefatos, siga esta estrutura e as regras adicionais listadas em seguida.

````text
.github/
.husky/
.oraculo/
dist/
docs/
  docs/banchs/
  docs/estruturas/
  docs/historico/
  docs/legado/
  docs/partials/
  docs/perf/
  docs/plugins/
  docs/relatorios/
  docs/specs/
  docs/templates/
  docs/tests/
  docs/*.md
node_modules/
preview-oraculo/
  dist/
  docs/
  oraculo.config.json
  oraculo.config.safe.json
  tsconfig.json
  tsconfig.eslint.json
  package.json
  README.md
  LICENSE
  THIRD-PARTY-NOTICES.txt
  PREVIEW.md
scripts/
src/
  src/@types/
  src/analistas/
  src/arquitetos/
  src/cli/
  src/guardian/
  src/nucleo/
  src/relatorios/
  src/tipos/
  src/zeladores/
  src/cli.ts
temp-fantasma/
tests/
  tests/analistas/
  tests/arquitetos/
  tests/cli/
  tests/fixtures/
  tests/guardian/
  tests/nucleo/
  tests/relatorios/
  tests/tipos/
  tests/zeladores/
  tests/tmp/
    tests/tmp/relatorios-test/
    tests/tmp/tmp-corretor-destino-existe-test/
    tests/tmp/tmp-perf-diff/
    tests/tmp/tmp-scan-only/
.gitattributes
.gitignore
.lintstageddrc.mjs
.prettierrc
CHANGELOG.md
CODE_OF_CONDUCT.md
CONTRIBUTING.md
eslint.config.js
inc-state.json
LICENSE.md
oraculos.config.json
package-lock.json
package.json
README.md
SEGURITY.md
THIRD-PARTY-NOTICES.txt
temp-cache-file.ts
tsconfig.eslint.json
tsconfig.json
vitest.config.ts
```text

Regras e orientações adicionais (obrigatórias):

- Técnicas implementadas pelo projeto devem ser agrupadas em pastas dedicadas de técnicas dentro do domínio apropriado em `src` (por exemplo `src/analistas/tecnicas/`, `src/zeladores/tecnicas/`). Não misture múltiplas técnicas diferentes em um único arquivo grande.
- Testes unitários e de integração devem ser criados exclusivamente sob a pasta `tests/` na raiz, usando subpastas por domínio (ex.: `tests/analistas/`, `tests/zeladores/`). Não coloque testes dentro de `src/` para evitar confusão entre código de produção e fixtures/testes.
- Quando for necessário adicionar um novo módulo com um objetivo distinto, crie uma pasta dedicada em `src/` com nome claro e documente o propósito no `README.md` local do módulo (ex.: `src/novo-modulo/README.md`). Evite adicionar responsabilidades multifuncionais a pastas já existentes.
- Fixtures e recursos de teste relacionados a detecção de estruturas/arquétipos devem residir em `tests/fixtures/estruturas/` conforme as novas diretrizes de testes por arquétipo.
- Scripts de build, geração de relatórios e utilitários de manutenção devem ficar em `scripts/` quando são ferramentas de repo; helpers de execução em runtime devem ficar em `src/nucleo/` ou no domínio apropriado.
- Siga o padrão de persistência centralizado (`src/zeladores/util/persistencia.ts`) para todas as leituras/escritas de estado e snapshots — nunca use `fs` diretamente fora desses helpers.

Observação: Nem todas as subpastas foram listadas detalhadamente; a árvore acima é o mapa de alto nível e referência para organização. Use-a como contrato estrutural para novos commits e para revisão de PRs.

## Referências

- Veja `docs/RELATORIO.md` para histórico de refatorações e decisões recentes.
- Consulte `tsconfig.json` para detalhes de build e aliases.
- Consulte `src/zeladores/util/persistencia.ts` para padrão de helpers de persistência.
- Veja `docs/relatorios/RELATORIO.md` para status atual (ex: contagem de testes).
- Consulte `docs/NOVAS-FUNCIONALIDADES-v0.2.0.md` para detalhes das novas funcionalidades.
- Veja `preview-oraculo/` para preview da publicação com todos os arquivos de configuração.

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

## Novas Diretrizes (2025-08-29)

### Versão Dinâmica do CLI

- A versão do CLI é lida dinamicamente do `package.json` em tempo de execução
- Removida versão hardcoded '1.0.0' do código fonte
- Implementada função `getVersion()` que lê o arquivo package.json
- Fallback para '0.0.0' em caso de erro de leitura

### Script Pre-Public Aprimorado

- Atualizado para incluir arquivos de configuração essenciais:
  - `oraculo.config.json` - Configurações principais
  - `oraculo.config.safe.json` - Configurações seguras
  - `tsconfig.json` - Configuração TypeScript principal
  - `tsconfig.eslint.json` - Configuração TypeScript para ESLint
- Preview agora totalmente funcional e autônomo
- Arquivos de configuração permitem execução independente do preview

### Correções Críticas Implementadas

- **Exclusão automática de node_modules**: Correção da análise desnecessária de dependências
- **Pool de Workers**: Sistema de paralelização automática ativo por padrão
- **Schema Versioning**: Versionamento automático com compatibilidade backward
- **Sistema de Pontuação Adaptativa**: Pontuação inteligente baseada no tamanho do projeto

### Detalhes das Novas Funcionalidades v0.2.0

#### Pool de Workers

- Sistema de paralelização automática com Worker Threads
- Configuração via variáveis de ambiente (WORKER_POOL_MAX_WORKERS, WORKER_POOL_BATCH_SIZE, etc.)
- Timeout inteligente de 30 segundos por analista
- Fallback automático para processamento sequencial

#### Schema Versioning

- Versionamento automático de relatórios JSON
- Compatibilidade backward garantida
- Metadados de versão em cada relatório
- Validação automática de integridade

#### Sistema de Pontuação Adaptativa

- Pontuação baseada no tamanho do projeto (1x-5x fatores)
- 3 modos de configuração: padrão, conservador, permissivo
- Pesos para frameworks e TypeScript
- Ajustes contextuais automáticos

---

### Documentação legada

- Mover documentos obsoletos para `docs/legado/` e manter stubs nos caminhos antigos com aviso e link de redirecionamento.
- Replicar a mesma estrutura no pacote de preview em `preview-oraculo/docs/legado/`.
- Planejamento ativo deve permanecer em `docs/CHECKLIST.md`.

### Filtros dinâmicos include/exclude

- Usar `--include` e `--exclude` unificados conforme semântica documentada.
- `include` explícito sobrepõe `exclude`/ignores; respeitar `node_modules` quando incluído.
- Silenciar logs verbosos durante montagem de `--json`.

---

**Última atualização das diretrizes: 2025-08-29**

---
````
