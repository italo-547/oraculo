## Helpers Utilitários e Persistência de Estado

Para facilitar a manutenção e evitar duplicidade de código, centralize funções auxiliares recorrentes (ex: helpers de persistência, manipulação de pendências, leitura/escrita de estado) em arquivos utilitários, preferencialmente em `src/zeladores/util/` ou similar.

### Exemplos de Helpers Utilitários

```ts
// Persistência simples de estado (JSON)
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

### Dicas

- Sempre que criar helpers para manipulação de pendências, relatórios ou persistência, documente-os e avalie se podem ser reaproveitados em outros domínios.
- Prefira helpers puros e sem efeitos colaterais, facilitando testes e manutenção.
- Se helpers crescerem, mova para um módulo utilitário dedicado e registre o padrão neste arquivo.

---

# Copilot Instructions for Oráculo CLI

## Visão Geral

Este projeto é uma CLI modular para análise, diagnóstico e manutenção de projetos, organizada em múltiplos domínios (analistas, arquitetos, zeladores, guardian, etc). O código é escrito em TypeScript ESM puro, com tipagem rigorosa e uso extensivo de aliases de importação.

## Estrutura Principal

- `src/cli.ts`: Entrada principal da CLI.
- `src/cli/`: Implementa comandos individuais (ex: `comando-diagnosticar.ts`, `comando-podar.ts`).
- `src/analistas/`, `src/arquitetos/`, `src/zeladores/`, `src/guardian/`: Núcleos de lógica para análise, diagnóstico, correção e verificação.
- `src/nucleo/`: Funções centrais de execução, parsing e scanner.
- `src/relatorios/`: Geração e estruturação de relatórios.
- `src/tipos/tipos.ts`: Define todos os tipos e interfaces compartilhados.

## Convenções e Padrões

- **Aliases de importação**: Use `@nucleo/*`, `@analistas/*`, etc, conforme definido em `tsconfig.json`.
- **Tipagem**: Sempre utilize tipos definidos em `src/tipos/tipos.ts`.
- **Modularização**: Cada domínio tem arquivos e funções bem separados.
- **ESM puro**: Não use `require`; apenas `import`/`export`.
- **Sem comentários removidos**: `removeComments: false` no build.

## Fluxos de Trabalho

- **Build**: Use o TypeScript com as opções do `tsconfig.json`. Saída em `dist/`.
- **Execução CLI**: Rode comandos via `node dist/cli.js <comando>` após build.
- **Aliases**: Sempre importe módulos usando os aliases do `tsconfig.json`.
- **Testes**: (Ainda não implementados, mas previstos no roadmap.)

## Exemplos de Uso de Alias

```ts
import { executar } from '@nucleo/executor';
import { analisarPadroes } from '@analistas/analista-padroes-uso';
```

## Decisões Arquiteturais

- Separação clara entre análise (analistas), diagnóstico (arquitetos), correção (zeladores) e verificação (guardian).
- Relatórios são sempre gerados via módulos em `src/relatorios/`.
- Tipos centralizados para garantir consistência entre domínios.

## Dependências e Requisitos

- Node.js >= 20.11.0
- TypeScript (veja `tsconfig.json` para detalhes)

## Referências

- Veja `RELATORIO.md` para histórico de refatorações e decisões recentes.
- Consulte `tsconfig.json` para detalhes de build e aliases.

---

Se encontrar padrões não documentados ou dúvidas sobre fluxos, registre exemplos neste arquivo para evoluir as instruções.
