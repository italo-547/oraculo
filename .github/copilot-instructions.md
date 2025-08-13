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

## Fluxos de Trabalho

- **Build**: Use o TypeScript com as opções do `tsconfig.json`. Saída em `dist/`.
- **Execução CLI**: Rode comandos via `node dist/cli.js <comando>` após build.
- **Aliases**: Sempre importe módulos usando os aliases do `tsconfig.json`.
- **Testes**: Já implementados (Vitest). Durante testes `process.env.VITEST` deve impedir chamadas a `process.exit`.
- **Persistência**: Sempre utilize os helpers centralizados para leitura/escrita de arquivos de estado, relatórios e snapshots.

## Flags Recentes / Comportamentos

- `--scan-only`: Executa somente varredura + priorização (sem técnicas mutáveis).
- `--full-scan` (guardian): Ignora padrões de ignore para inspeção pontual (não persiste baseline).
- `--json`: Saída estruturada em `diagnosticar` e `guardian` (consumível por CI/pipelines).

## Agregação de PARSE_ERRO

Para reduzir ruído:

- Erros de parsing por arquivo podem ser agregados após limite configurável (`PARSE_ERRO_MAX_POR_ARQUIVO`).
- Contagem total original é preservada em campo interno (`__ORACULO_PARSE_ERROS_ORIG_TOTAL__`).
- Objetivo: permitir análise de tendência sem inundar logs.
- Próximo passo: expor limites e política no README.

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
