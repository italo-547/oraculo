> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Sistema de Versionamento de Schema

## Visão Geral

O sistema de versionamento de schema garante compatibilidade futura dos relatórios JSON gerados pelo Oráculo, permitindo evoluções controladas do formato de dados sem quebrar ferramentas consumidoras.

## Estrutura dos Relatórios Versionados

````json
{
  "_schema": {
    "versao": "1.0.0",
    "criadoEm": "2025-08-28",
    "descricao": "Descrição do relatório",
    "compatibilidade": ["1.0.0"],
    "camposObrigatorios": ["_schema", "dados"],
    "camposOpcionais": ["_schema.compatibilidade"]
  },
  "dados": {
    // Dados originais do relatório
  }
}
```ts

## Campos do Schema

### Obrigatórios

- `versao`: Versão do schema (formato semântico: major.minor.patch)
- `criadoEm`: Data de criação da versão (YYYY-MM-DD)
- `descricao`: Descrição das mudanças nesta versão

### Opcionais

- `compatibilidade`: Array de versões compatíveis para leitura
- `camposObrigatorios`: Lista de campos obrigatórios nesta versão
- `camposOpcionais`: Lista de campos opcionais nesta versão

## API de Versionamento

### Criar Relatório Versionado

```typescript
import { criarRelatorioComVersao } from '@nucleo/schema-versao';

const dados = { totalArquivos: 100, status: 'ok' };
const relatorio = criarRelatorioComVersao(dados, '1.0.0', 'Relatório de diagnóstico');
````

### Validar Schema

````typescript
import { validarSchema } from '@nucleo/schema-versao';

const validacao = validarSchema(relatorio);
if (!validacao.valido) {
  console.error('Erros:', validacao.erros);
}
```ts

### Migrar Relatório Legado

```typescript
import { migrarParaVersaoAtual } from '@nucleo/schema-versao';

const relatorioMigrado = migrarParaVersaoAtual(relatorioLegado);
````

### Ler Relatório Versionado

````typescript
import { lerRelatorioVersionado } from '@zeladores/util/leitor-relatorio';

const resultado = await lerRelatorioVersionado({
  caminho: 'relatorio.json',
  validar: true,
  migrar: true,
});

if (resultado.sucesso) {
  console.log('Dados:', resultado.dados);
  console.log('Versão:', resultado.schema?.versao);
}
```bash

## Histórico de Versões

### 1.0.0 (2025-08-28)

- **Descrição**: Versão inicial com campos básicos de relatório
- **Compatibilidade**: 1.0.0
- **Campos obrigatórios**:
  - `_schema`
  - `dados`
  - `_schema.versao`
  - `_schema.criadoEm`
  - `_schema.descricao`
- **Campos opcionais**:
  - `_schema.compatibilidade`
  - `_schema.camposObrigatorios`
  - `_schema.camposOpcionais`

## Estratégia de Migração

1. **Relatórios legados** (sem `_schema`) são automaticamente embrulhados na versão atual
2. **Validação opcional** permite processar relatórios com schema inválido
3. **Compatibilidade backward** é mantida através do campo `compatibilidade`
4. **Migração automática** preserva dados originais sem perdas

## Boas Práticas

### Para Consumidores de Relatórios

1. Sempre valide o schema antes de processar dados
2. Use migração automática para relatórios legados
3. Verifique compatibilidade de versão quando necessário
4. Trate campos opcionais de forma defensiva

### Para Desenvolvedores do Oráculo

1. Incremente versão para mudanças breaking
2. Documente todas as mudanças no histórico
3. Mantenha compatibilidade backward quando possível
4. Atualize testes após mudanças de schema

## Exemplos de Uso

### CLI: Gerar Relatório Versionado

```bash
# Relatório Markdown (não versionado)
oraculo diagnosticar --output relatorio.md

# Relatório JSON versionado
oraculo diagnosticar --json > relatorio.json
````

### Ferramenta Consumidora

````typescript
import { lerRelatorioVersionado } from '@zeladores/util/leitor-relatorio';

async function processarRelatorio(caminho: string) {
  const resultado = await lerRelatorioVersionado({
    caminho,
    validar: true,
    migrar: true,
  });

  if (!resultado.sucesso) {
    throw new Error(resultado.erro);
  }

  // Processar dados
  const { totalArquivos, status } = resultado.dados;
  console.log(`Processados ${totalArquivos} arquivos com status ${status}`);

  // Verificar versão se necessário
  if (resultado.schema?.versao !== '1.0.0') {
    console.warn('Versão do relatório pode ter incompatibilidades');
  }
}
```bash

## Testes

O sistema inclui cobertura completa de testes:

- ✅ Validação de schema
- ✅ Migração automática
- ✅ Criação de relatórios versionados
- ✅ Leitura de relatórios do disco
- ✅ Tratamento de erros

Execute os testes com:

```bash
npm test -- tests/nucleo/schema-versao.test.ts
npm test -- tests/zeladores/leitor-relatorio.test.ts
````

## Futuras Extensões

- **Validação de campos específicos** por versão
- **Migrações complexas** entre versões incompatíveis
- **Schema registry** para descoberta automática
- **Validação em tempo real** durante geração de relatórios
