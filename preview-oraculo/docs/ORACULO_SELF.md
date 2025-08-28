Resumo: Arquitetura "oraculo-self"

Este repositório é o próprio Oráculo. Para evitar ruído na auto-análise, adicionamos uma configuração local que explica a intenção do layout do projeto e ajusta filtros usados pelo detector de estrutura.

Chave registrada

- `REPO_ARQUETIPO`: "oraculo-self"

Significado

- Indica que o repositório é o produto/CLI Oráculo em si, com múltiplos artefatos (fixtures, previews, docs, exemplos) que não representam um monorepo convencional de produção.
- Serve como metadado para humanos e para futuras heurísticas do Oráculo. Não altera a lógica de detecção por si só, mas documenta a intenção do mantenedor.

Por que manter `estrutura-config` como informação

- `package.json` e `tsconfig.json` são sinais úteis: indicam que o repositório é um projeto Node/TypeScript e ajudam nos diagnósticos e em integrações (CI, editors, ferramentas). Remover essa detecção tiraria visibilidade útil.
- Mantivemos `estrutura-config` como `info` (não erro) e agrupamos as ocorrências para reduzir ruído.

O que a configuração local faz (resumo)

- Exclui diretórios de preview e fixtures (`preview-oraculo/**`, `tests/fixtures/**`) das varreduras estruturais para evitar que exemplos contaminar a análise.
- Aumenta o limite de arquivos considerados "muitos arquivos na raiz" para 50.
- Define `REPO_ARQUETIPO: "oraculo-self"` como metadado de intenção.

Como reverter ou ajustar

- Remover o arquivo `oraculo.config.json` (raiz) desfaz todas as alterações de mesclagem de configuração.
- Para ajustar filtros, edite `oraculo.config.json` e altere `INCLUDE_EXCLUDE_RULES.globalExcludeGlob` ou `ESTRUTURA_ARQUIVOS_RAIZ_MAX`.

Notas práticas

- Esta abordagem mantém a originalidade do Oráculo e reduz avisos de estrutura sem alterar o código.
- Se quiser que os detectores considerem `oraculo-self` explicitamente (p.ex., alterar severidade de certos sinais), eu posso aplicar mudanças adicionais seguras nas heurísticas após sua confirmação.
