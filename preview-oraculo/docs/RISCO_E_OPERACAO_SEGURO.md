> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

Riscos e Operação Segura — Oráculo

Este documento descreve os principais vetores de risco identificados ao executar o Oráculo em repositórios de terceiros e as medidas que o Oráculo aplica por padrão para reduzir danos.

Resumo rápido

- SAFE_MODE (padrão): impede execução de plugins, comandos shell e mutações no sistema de arquivos, a menos que permissões explícitas sejam concedidas.
- Para realizar alterações automáticas ou executar plugins, o usuário deve dar consentimento explícito via variáveis de ambiente (ex.: ORACULO_ALLOW_PLUGINS=1) ou flags de CLI.

Vetores principais

1. Plugins dinâmicos

- O que: carregamento via import() de módulos apontados na configuração (`STRUCTURE_PLUGINS` e similares).
- Risco: o plugin pode executar código arbitrário no processo (IO, rede, execução de comandos, etc.).
- Mitigação: em `SAFE_MODE` o carregamento de plugins é bloqueado; para permitir, defina `ORACULO_ALLOW_PLUGINS=1` explicitamente.

2. Execução de comandos shell

- O que: uso de `execSync` para operações de coleta de informações (`git rev-parse`) e atualizações (`npm install`).
- Risco: execução de comandos com as permissões do usuário que executa o Oráculo.
- Mitigação: em `SAFE_MODE` execuções de shell são bloqueadas; para permitir, defina `ORACULO_ALLOW_EXEC=1` explicitamente.

3. Operações mutáveis no repositório (escrita, rename, unlink)

- O que: reescrita de arquivos, movimento/remoção, criação de diretórios (ex.: `corretor-estrutura`, `poda`, `guardian` que grava baselines).
- Risco: alterações acidentais ou maliciosas no conteúdo do repositório.
- Mitigação: em `SAFE_MODE` mutações são simuladas; para permitir, defina `ORACULO_ALLOW_MUTATE_FS=1` explicitamente.

4. Rede e envios automáticos

- O que: hoje não há chamadas explícitas a fetch/axios/http no core. Ferramentas auxiliares/plug-ins podem introduzir.
- Risco: exfiltração de dados se plugins maliciosos forem permitidos.
- Mitigação: políticas de plugin e operação em ambientes isolados.

Práticas operacionais recomendadas

- Execute Oráculo em modo `--scan-only` e `SAFE_MODE` por padrão para terceiros.
- Para autorizar mutações, exija dois fatores de consentimento: (1) flag `--auto-fix` e (2) variável de ambiente explicita `ORACULO_ALLOW_MUTATE_FS=1`.
- Rodar em CI isolado (container/VM) com snapshot do repositório antes de qualquer mutação.
- Nunca executar com privilégios administrativos.

Como permitir ações (exemplo)

# permitir somente plugins

ORACULO_ALLOW_PLUGINS=1 node dist/bin/index.js diagnosticar

# permitir mutações (dupla confirmação recomendada)

ORACULO_ALLOW_MUTATE_FS=1 ORACULO_ALLOW_PLUGINS=1 node dist/bin/index.js diagnosticar --auto-fix

Notas finais

Estas proteções reduzem superfícies de risco, mas não eliminam todos os vetores (por exemplo, um plugin com permissão pode ainda realizar ações perigosas). Mantenha procedimentos operacionais claros e uma whitelist de plugins quando possível.
