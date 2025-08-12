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
| `--scan-only` (planejada) | Executa somente varredura e priorização, sem aplicar técnicas                |

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

Estado atual: 304 testes passando (data: 2025-08-12). A contagem pode evoluir.

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

- [ ] Implementar flag `--scan-only`
- [ ] Testes ponta-a-ponta executando binário buildado
- [ ] Documentar criação de plugins (guia prático)
- [ ] Métricas de performance (scan grande / memória)
- [ ] Integração contínua com lint + format + coverage gate
- [ ] Relatório de baseline de performance

---

**Autor:** Italo C Lopes  
**Licença:** MIT

---
Notas rápidas de manutenção:

- Evite duplicar lógica de persistência
- Prefira funções puras para analistas e relatórios
- Use aliases sempre (ex: `@nucleo/*`) em vez de caminhos relativos longos
- Mantenha testes alinhados a contratos claros (evitar mocks frágeis)
