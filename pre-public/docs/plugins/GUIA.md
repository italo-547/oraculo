# Guia de Criação de Plugins do Oráculo

Este guia descreve como estender o Oráculo adicionando novas técnicas (analistas) ou plugins de estrutura.

> Atualizado em 2025-08-12 com suporte a flags `--scan-only`, `--json` e contexto de agregação de `PARSE_ERRO`.

## Visão Rápida

Você pode estender o Oráculo de duas formas principais:

1. Técnicas / Analistas (estendem a análise executada em `diagnosticar`).
2. Plugins de Estrutura (executados pelo `corretor-estrutura` para refinar mapa estrutural ou aplicar ajustes internos).

Ambos são carregados em tempo de execução e devem ser modulares (ESM). Erros não interrompem a execução principal: são capturados e registrados como ocorrências ou avisos de log.

---

## 1. Técnicas / Analistas

Uma técnica implementa a interface `Tecnica` (ou `Analista` – superset) definida em `src/tipos/tipos.ts`.

### Interface Essencial

```ts
export interface Tecnica {
  nome?: string;          // Identificação (fortemente recomendado)
  global?: boolean;       // true = roda uma vez (contexto global)
  test?: (relPath: string) => boolean; // filtra arquivos
  aplicar: (
    src: string,
    relPath: string,
    ast: NodePath | null,
    fullPath?: string,
    contexto?: ContextoExecucao,
  ) => Ocorrencia | Ocorrencia[] | null | undefined | Promise<...>;
}
```

### Passos para Criar

1. Criar arquivo em `src/analistas/` (ex: `analista-minha-tecnica.ts`).
2. Implementar a função `aplicar` retornando:
   - `null/undefined` se nenhuma ocorrência.
   - Uma `Ocorrencia` ou lista de ocorrências.
3. Exportar o analista/técnica e adicioná-lo ao array `registroAnalistas` em `src/analistas/registry.ts`.
4. Criar testes (unitários + se aplicável integração) validando entradas/saídas.
5. Rodar `npm run gerar:analista <nome>` para scaffold automático (opcional) e ajustar template.

### Exemplo Mínimo

```ts
// src/analistas/analista-todo-comments.ts
import type { Analista, TecnicaAplicarResultado } from '../tipos/tipos.js';
import { criarOcorrencia } from '../tipos/tipos.js';

export const analistaTodoComments: Analista = {
  nome: 'todo-comments',
  categoria: 'qualidade',
  descricao: 'Detecta comentários TODO deixados no código.',
  aplicar(src, relPath): TecnicaAplicarResultado {
    if (!src.includes('TODO')) return null;
    const linhas = src.split(/\r?\n/);
    const ocorrencias = linhas
      .map((l, i) => (l.includes('TODO') ? i + 1 : null))
      .filter(Boolean)
      .map((linha) =>
        criarOcorrencia({
          tipo: 'TODO_PENDENTE',
          mensagem: 'Comentário TODO encontrado',
          nivel: 'aviso',
          relPath,
          linha: linha as number,
          origem: 'todo-comments',
        }),
      );
    return ocorrencias;
  },
};
```

Adicionar ao registro:

```ts
// src/analistas/registry.ts
import { analistaTodoComments } from './analista-todo-comments.js';
export const registroAnalistas = [
  // ...existentes,
  analistaTodoComments,
];
```

### Boas Práticas

- Prefira funções puras: derivar ocorrências somente de `src`/`ast`.
- Use `test(relPath)` para limitar arquivos (evita custo desnecessário).
- Para análises que dependem de todo o projeto (ex: estatísticas globais), marque `global: true` e use `contexto.arquivos`.
- Sempre defina `origem` nas ocorrências (facilita rastreio e filtros).
- Não realizar IO direto; se precisar, use helpers centralizados (persistência, etc.).
- Em caso de erro, permita exceção ser capturada: será convertida em ocorrência de erro analista.

#### Campos Recomendados Extras (quando usar Analista ao invés de Tecnica mínima)

- `categoria`: agrupa por tipo (ex: 'complexidade', 'qualidade', 'estrutura').
- `descricao`: pequena frase exibida em listagens e documentação automática.
- `sempreAtivo`: se implementado no futuro, sinaliza que não deve ser filtrado.

#### Uso com `--scan-only`

No modo `--scan-only` apenas varredura e priorização ocorrem; técnicas não mutáveis continuam sendo executadas (análise de leitura). Evite dependências em efeitos de zeladores.

---

## 2. Plugins de Estrutura

Executados pelo módulo `corretor-estrutura`. Modificam ou enriquecem a representação estrutural antes de correções.

### Forma de Carregamento

Definidos em `config.json` (ou fonte de configuração) na chave `STRUCTURE_PLUGINS` (array de caminhos relativos ou absolutos). Cada item é importado dinamicamente.

Suportado:

- Export default função async.
- Export direto de função (module export = function...).

### Assinatura Esperada

```ts
interface PluginEstruturaContexto {
  mapa: unknown; // Mapa estrutural atual
  baseDir: string; // Diretório base
  layers: string[]; // Camadas detectadas
  fileEntries: Array<{ relPath: string; fullPath: string; content: string | null }>;
}

export type PluginEstrutura = (ctx: PluginEstruturaContexto) => void | Promise<void>;
```

### Exemplo

```ts
// plugins/marcar-infra.ts
import type { PluginEstrutura } from '../src/zeladores/corretor-estrutura.js';

const plugin: PluginEstrutura = async ({ mapa, layers, baseDir }) => {
  if (Array.isArray(layers) && layers.includes('infra')) {
    (mapa as any).temInfra = true;
  }
};

export default plugin;
```

Registrar caminho no config (exemplo conceitual):

```jsonc
{
  "STRUCTURE_PLUGINS": ["./plugins/marcar-infra.js"],
}
```

### Boas Práticas (Plugins Estrutura)

- Plugins devem ser idempotentes (rodar duas vezes não altera resultado adicional).
- Evite efeitos colaterais externos (sem manipular FS diretamente exceto via helpers, se necessário).
- Envolva transformações complexas em try/catch interno somente se recuperar estado for seguro; caso contrário deixe erro propagar (será logado como aviso sem quebrar fluxo).
- Não alterar campos inesperados em `fileEntries`; criar novas propriedades sob namespace (`_pluginX`) se precisar estender.

### Carregamento Dinâmico e Resolução de Caminhos

Ordem de resolução por item em `STRUCTURE_PLUGINS`:

1. Caminho absoluto usado diretamente.
2. Caminho relativo resolvido a partir do diretório de execução (raiz do projeto Oráculo).
3. (Futuro) Nome de pacote npm (`oraculo-plugin-*`).

Segurança: Caminhos são validados — plugins fora da raiz do projeto são ignorados e logados.

Falhas de import são logadas como aviso; execução prossegue.

### Config via Variáveis de Ambiente

Você pode sobrescrever `STRUCTURE_PLUGINS` via env exportando JSON:

`ORACULO_STRUCTURE_PLUGINS='["./plugins/marcar-infra.js"]'`

O merge final considera (ordem de precedência crescente): defaults < arquivo config < env < flags CLI.

---

## 3. Testando sua Técnica / Plugin

1. Criar testes unitários para a lógica principal (detecção / transformação).
2. Criar teste de integração caso a técnica dependa de várias outras (ex: estatísticas globais).
3. Opcional: E2E se comportamento pós-build for crítico.
4. Garantir que falhas artificiais gerem ocorrência `ERRO_ANALISTA` (ver testes existentes em `analista-*` ou `executor.test.ts`).

### Testando Saída JSON (`--json`)

Para validar compatibilidade com pipelines, rode comando com `--json` e assegure que suas ocorrências aparecem com campos esperados (`tipo`, `mensagem`, `nivel`, `relPath`, etc.).

Use snapshot test moderado (filtrar campos voláteis) para evitar fragilidade.

### Exemplo de Teste Simples

```ts
import { analistaTodoComments } from '../analistas/analista-todo-comments.js';

it('detecta TODO', () => {
  const src = '// TODO ajustar\nconsole.log(123)';
  const res = analistaTodoComments.aplicar(src, 'arquivo.js', null as any);
  expect(Array.isArray(res) && res.length).toBe(1);
});
```

---

## 4. Convenções de Nome

- Arquivos de técnicas: `analista-<descricao>.ts` ou `<categoria>-<foco>.ts` quando ainda não padronizado.
- Tipos de ocorrência: UPPER_SNAKE_CASE descritivo (ex: `TODO_PENDENTE`, `FUNCAO_COMPLEXA`).
- Nome de plugin: contexto curto (ex: `marcar-infra`, `ajustar-alias`).

---

## 5. Checklist Antes de Submeter

- [ ] Nome claro (`nome` definido na técnica)
- [ ] Testes cobrindo pelo menos 1 caso positivo e 1 negativo
- [ ] Sem IO direto não mediado; se houver, justificar
- [ ] Tipos reutilizados de `src/tipos/tipos.ts`
- [ ] Registro atualizado (`registry.ts` ou config do plugin)
- [ ] Documentação breve (1-2 linhas) adicionada onde relevante
- [ ] Validação manual do modo `--json` (se aplicável)
- [ ] Nenhuma dependência pesada desnecessária (avaliar impacto de build)
- [ ] Teste de contrato (`analistas-contrato.test.ts`) permanece verde

---

## 6. Roadmap Futuro de Extensibilidade

- Carregamento dinâmico condicional por categoria / filtro de CLI.
- Cache incremental por técnica (guardar heurísticas de última execução).
- Sandboxing leve (VM) para plugins não confiáveis.
- Sistema de versão e compatibilidade para evitar quebra em upgrades.
- Hooks de ciclo de vida (pré-scan, pós-scan, pré-relatorio) para extensões avançadas.
- Cache granular por técnica (evitar reprocessar arquivos imutáveis com hash estável).

---

## 7. Suporte & Dúvidas

Abra uma Issue descrevendo intenção, exemplo de ocorrência e impacto esperado. Forneça snippet mínimo de reprodução.

---

Licença do guia: MIT (seguir decisão final de licença do projeto).

---

Para exemplos reais, explore `src/analistas/` e testes associados. Qualquer padrão recorrente útil pode ser abstraído em helper utilitário compartilhado.
