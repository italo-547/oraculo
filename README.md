# Oráculo CLI

[![CI](https://github.com/aynsken/oraculo/actions/workflows/ci.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/ci.yml)
[![Build](https://github.com/aynsken/oraculo/actions/workflows/build.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/build.yml)
[![Monitor Deps](https://github.com/aynsken/oraculo/actions/workflows/monitor-deps.yml/badge.svg)](https://github.com/aynsken/oraculo/actions/workflows/monitor-deps.yml)

Oráculo é uma CLI modular para análise, diagnóstico e manutenção de projetos, com arquitetura extensível via plugins e comandos customizados.

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

### Rodar a CLI

```bash
npm run build
node dist/cli.js <comando>
```

Exemplo:

```bash
node dist/cli.js diagnosticar
node dist/cli.js podar
```

### Flags Globais

Você pode usar as flags globais em qualquer comando para controlar o nível de logs e exportação de relatórios:

| Flag        | Descrição                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------- |
| `--silence` | Silencia todos os logs de informação e aviso (sobrepõe `--verbose`)                       |
| `--verbose` | Exibe logs detalhados de cada arquivo e técnica analisada (ignorado se `--silence` ativo) |
| `--export`  | Gera arquivos de relatório detalhados (JSON e Markdown)                                   |
| `--dev`     | Ativa modo de desenvolvimento (logs de debug)                                             |

#### Exemplos de uso:

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
- `guardian` — Verificações de integridade
- ...e outros! Veja todos com:
  ```bash
  node dist/cli.js --help
  ```

## 🧪 Testes

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

## 🤝 Contribuição

- Siga o padrão de helpers centralizados (`src/zeladores/util/`)
- Use aliases de importação do `tsconfig.json`
- Sempre escreva testes para novos recursos
- Sugestões? Abra uma issue ou PR!

## 📋 Roadmap

- [ ] Automatizar CI/CD
- [ ] Testes de integração ponta-a-ponta
- [ ] Melhorar documentação de plugins
- [ ] Preparar para produção

---

**Autor:** Italo C Lopes  
**Licença:** MIT
