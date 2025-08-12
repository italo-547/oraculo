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

```bash
git clone https://github.com/aynsken/oraculo.git
cd oraculo
npm install
```

## 🖥️ Como usar

### Rodar a CLI (local)

```bash
npm run build
node dist/cli.js <comando>
```

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

| Flag        | Descrição                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------- |
| `--silence` | Silencia todos os logs de informação e aviso (sobrepõe `--verbose`)                       |
| `--verbose` | Exibe logs detalhados de cada arquivo e técnica analisada (ignorado se `--silence` ativo) |
| `--export`  | Gera arquivos de relatório detalhados (JSON e Markdown)                                   |
| `--dev`     | Ativa modo de desenvolvimento (logs de debug)                                             |
| `--scan-only` | Executa somente varredura e priorização, sem aplicar técnicas                |

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
- [x] Documentar criação de plugins (guia prático + exemplo mínimo)
- [ ] Métricas de performance (scan grande / memória)
- [ ] Baseline comparativa de performance por commit
- [ ] Relatório de baseline de performance automatizado
- [ ] Guia de padronização / estilo de código (linters + convenções)

## 🧬 Camadas de Teste (Resumo)

| Camada | Objetivo | Exemplos |
| ------ | -------- | -------- |
| Unidade | Validar funções/helpers isolados | analistas individuais |
| Integração | Fluxos entre módulos | inquisidor + executor |
| Guardian/Persistência | Baseline, diff, hash | `guardian/*` |
| CLI Commands | Comportamento de comandos sem build | `comando-*.test.ts` |
| E2E Binário | Execução real pós-build | `e2e-bin.test.ts` |

### Cenários E2E Atuais

- Modo `--scan-only` (exit 0)
- `--scan-only --export` gera arquivo JSON
- Diagnóstico completo benigno (exit 0)
- Criação de baseline guardian (exit 0)
- Ocorrência com erro técnico gera exit code 1

Detalhes completos em `docs/relatorios/camadas-testes.md`.

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

---
Notas rápidas de manutenção:

- Evite duplicar lógica de persistência
- Prefira funções puras para analistas e relatórios
- Use aliases sempre (ex: `@nucleo/*`) em vez de caminhos relativos longos
- Mantenha testes alinhados a contratos claros (evitar mocks frágeis)
