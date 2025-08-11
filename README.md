# Oráculo CLI

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
