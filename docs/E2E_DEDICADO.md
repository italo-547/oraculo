E2E_DEDICADO — Diagnóstico e procedimentos para problemas com E2E (aliases @)

Resumo rápido

- Propósito: documentar os problemas observados nas E2E que envolvem resolução de alias `@` e movimentação de arquivos (`reestruturar`), como reproduzir, como limpar artefatos temporários com segurança e como rodar a suite completa.
- Conclusão curta: é seguro apagar os diretórios temporários gerados pelos testes (padrão: `oraculo-e2e-*` no diretório do sistema temporário), desde que não haja processos de teste em execução; após limpeza, os E2E que falhavam por conflito de destino devem ser reexecutados em ambiente limpo e tipicamente passam.

Checklist (o que cobre este documento)

- [x] Causa comum: loader não passado como `file://` URL ao spawn do Node (no Windows) — corrige erro de `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
- [x] Causa comum: `node.loader.mjs` resolvendo aliases relativo a `process.cwd()` em vez de `import.meta.url` — pode procurar `dist/` no temp e causar ENOENT.
- [x] Causa comum: destino já existente em runs anteriores → corretor registra conflito e não aplica a movimentação (import não reescrito).
- [x] Recomendação de limpeza segura dos temporários.
- [x] Comandos e passos para reproduzir e rodar a suite completa de testes.

Detalhes técnicos e reprodução

1. Problema 1: resolução de alias `@` quando a CLI compilada (`dist/cli.js`) é spawnada por testes.

- O CLI usa imports `@/...` no código fonte. Para que o Node execute `dist/cli.js` e resolva esses specifiers, usamos um loader ESM (`node.loader.mjs`) que reescreve specifiers `@` para caminhos reais em `dist/`.
- No Windows o loader tem de ser passado para o Node como um URL `file://.../node.loader.mjs`. Passar um caminho absoluto sem esquema resulta em `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
- O loader também deve resolver sua raiz a partir do próprio arquivo (usando `import.meta.url`) — caso contrário, se ele usar `process.cwd()` a resolução pode apontar para o diretório temporário do teste e não encontrar `dist/`.

2. Problema 2: reescrita de imports quando um arquivo é movido (`reestruturar --auto`).

- O `OperarioEstrutura.aplicar` chama `reescreverImports` quando `STRUCTURE_AUTO_FIX=true` e `SAFE_MODE`/`ALLOW_MUTATE_FS` permitem gravação.
- Se o destino já existir (por exemplo, restos de uma execução anterior), o correto comportamento é registrar conflito e NÃO sobrescrever. Nesse caso o arquivo no destino pode conter ainda a import original com alias (test falha esperando import reescrito).
- Em execução em ambiente limpo, o reescritor (`src/zeladores/util/imports.ts`, compilado em `dist/...`) converte `@/cli/utils/a.js` para `../../../utils/a` (sem `.js`) — confirmado por execução direta.

Limpeza segura de temporários (recomendado antes de rodar E2E completas)

- Pode apagar com segurança diretórios temporários criados pelos testes que seguem o padrão `oraculo-e2e-*` no diretório temporário do OS, desde que:
  - nenhum processo de teste/CLI esteja rodando (ver `Get-Process`/Task Manager),
  - você remova apenas os diretórios cujo nome comece com `oraculo-e2e-` (evita remover outros dados temporários).

Comandos PowerShell (listagem antes de apagar):

```powershell
# listar candidatos (sem remover ainda)
Get-ChildItem -Path $env:TEMP -Directory -Filter 'oraculo-e2e-*' | Sort-Object LastWriteTime -Descending | Format-List FullName,LastWriteTime

# se OK, apagar (permanente):
Get-ChildItem -Path $env:TEMP -Directory -Filter 'oraculo-e2e-*' | Remove-Item -Recurse -Force
```

Observações sobre o `.oraculo` dentro do temp

- Os testes criam pequenos artefatos de estado em `.oraculo/` dentro do temp para registrar mapas de reversão e métricas. Eles também são temporários e podem ser apagados com o diretório do teste.
- Se quiser preservar mapas de reversão para análise, copie `.oraculo/mapa-reversao.json` antes de apagar.

Como rodar a suite completa (recomendações)

1. Limpeza prévia (recomendado): executar os comandos de listagem e remoção acima.
2. Certifique-se que `dist/` está atualizado: `npm run build` (o script de `pretest` do repositório pode escolher não buildar localmente; é seguro executar `npm run build`).
3. Executar a suite de testes (Vitest) com: `npm test` (ou `npm run test` dependendo do package.json).

Notas específicas para E2E no Windows

- Os testes E2E do repositório já foram ajustados para:
  - passar `--loader` como `file://.../node.loader.mjs` (uso de `pathToFileURL(resolve('node.loader.mjs')).toString()`),
  - spawnar o processo com `cwd` apontando para o diretório temporário do projeto sob teste,
  - limpar `VITEST` do env do processo filho quando necessário (para que o filho encerre normalmente),
  - usar `process.execPath` para chamar Node em vez de `node` direto.

- Para reproduzir um E2E manualmente (exemplo minimal):
  - criar temp, escrever `oraculo.config.json` com `{"STRUCTURE_AUTO_FIX":true}`, escrever os arquivos de exemplo, compilar o projeto `npm run build`, então spawnar o CLI:

```powershell
# exemplo resumido (PowerShell)
Set-Location 'C:\caminho\para\repo'
$loader = [node]::Invoke('node -e "console.log(require(\'url\').pathToFileURL(require(\'path\').resolve(\'node.loader.mjs\')).toString())"')
& node --loader $loader C:\caminho\para\repo\dist\cli.js reestruturar --auto --domains --prefer-estrategista --silence
```

Notas finais / verificação

- Se você vai apagar os temps no seu ambiente local: pode apagar com segurança os diretórios que correspondem a `oraculo-e2e-*` (confirme que não há processos de teste ativos).
- Depois da limpeza, recomendo rodar os dois testes problemáticos isoladamente primeiro (`tests/cli/e2e-reestruturar.test.ts` e `tests/cli/e2e-bin.test.ts`) e só então a suite completa.

Registro rápido de diagnóstico (para referência futura)

- Loader: sempre passe como `file://` no Windows.
- Reescrita de imports: remova `.js` das reescritas, converta `@/` para `src/` internamente e calcule relativo a partir do destino.
- Conflitos de destino: runs sujos causam falsos-falhos do E2E; limpeza resolve a maior parte desses casos.

Contato/devnotes

- Ao rodar a suite completa localmente, capture o output das E2E e, se houver falhas persistentes, cole os trechos (stderr/stdout e mapa de reversão `.oraculo/mapa-reversao.json`) para análise.

---

Gerado automaticamente em execução de debug local — mantenha este arquivo em `docs/` para referência dos devs E2E.
