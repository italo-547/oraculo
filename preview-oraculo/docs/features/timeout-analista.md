> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Timeout por Analista

## 📋 **VISÃO GERAL**

O Oráculo implementa um sistema de timeout por analista individual para prevenir travamentos e garantir que a análise continue mesmo quando um analista específico apresenta problemas de performance.

## ⚙️ **CONFIGURAÇÃO**

### **Variável de Ambiente**

```bash
# Timeout em milissegundos (padrão: 30000 = 30 segundos)
ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS=30000

# Desabilitar timeout (0)
ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS=0
```

### **Arquivo de Configuração**

```json
{
  "ANALISE_TIMEOUT_POR_ANALISTA_MS": 30000
}
```

## 🔧 **COMO FUNCIONA**

### **Mecanismo de Timeout**

- Cada analista (global ou por arquivo) é executado com `Promise.race()`
- Uma promise de timeout compete com a execução do analista
- Se o timeout vencer primeiro, a execução é cancelada
- Uma ocorrência de erro é registrada com detalhes do timeout

### **Tratamento de Erros**

- **Timeouts**: Registrados como avisos (não erros) para não falhar a análise
- **Erros normais**: Continuam sendo tratados como erros críticos
- **Logs diferenciados**: Timeouts usam ícone ⏰, erros usam ícone ❌

## 📊 **EXEMPLO DE SAÍDA**

### **Com Timeout Ativo**

```
⏰ Timeout: analista 'analista-funcoes-longas' excedeu 30000ms para src/arquivo-grande.ts
```

### **No Relatório JSON**

```json
{
  "ocorrencias": [
    {
      "tipo": "ERRO_ANALISTA",
      "relPath": "src/arquivo-grande.ts",
      "mensagem": "Timeout na técnica 'analista-funcoes-longas' para src/arquivo-grande.ts: 30000ms excedido",
      "origem": "analista-funcoes-longas",
      "nivel": "erro"
    }
  ]
}
```

## 🎯 **CASOS DE USO**

### **Cenário 1: Arquivos Muito Grandes**

- Analistas que fazem análise profunda podem travar em arquivos muito grandes
- Timeout garante que a análise continue para outros arquivos

### **Cenário 2: Analistas com Bugs**

- Loops infinitos ou algoritmos ineficientes são interrompidos
- Sistema permanece estável mesmo com analistas problemáticos

### **Cenário 3: Análise em CI/CD**

- Timeouts curtos evitam que builds travem
- Análise parcial é melhor que nenhuma análise

## 🔍 **IMPLEMENTAÇÃO TÉCNICA**

### **Código Principal** (`src/nucleo/executor.ts`)

```typescript
// Timeout configurável por analista
const timeoutMs = config.ANALISE_TIMEOUT_POR_ANALISTA_MS;

if (timeoutMs > 0) {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Timeout: analista '${tecnica.nome}' excedeu ${timeoutMs}ms para ${entry.relPath}`,
        ),
      );
    }, timeoutMs);
  });

  resultado = await Promise.race([execPromise, timeoutPromise]);
} else {
  resultado = await tecnica.aplicar(/* ... */);
}
```

### **Cobertura de Testes**

- ✅ Timeout funciona corretamente
- ✅ Execução normal quando timeout = 0
- ✅ Tratamento adequado de erros de timeout
- ✅ Métricas e logs apropriados

## 📈 **MÉTRICAS E MONITORAMENTO**

### **Logs Estruturados**

```json
{
  "tipo": "analista",
  "arquivo": "src/arquivo.ts",
  "nome": "analista-funcoes-longas",
  "duracaoMs": 25000,
  "timeoutExcedido": true
}
```

### **Relatórios de Timeout**

- Contagem de timeouts por analista
- Arquivos que mais sofrem timeouts
- Padrões de performance por tipo de arquivo

## 🚨 **RECOMENDAÇÕES**

### **Timeouts Sugeridos**

- **Desenvolvimento**: 60000ms (1 minuto) - mais permissivo
- **CI/CD**: 30000ms (30 segundos) - mais rigoroso
- **Análise profunda**: 120000ms (2 minutos) - para analistas complexos

### **Monitoramento**

- Monitore logs de timeout para identificar analistas problemáticos
- Ajuste timeouts baseado na performance real do projeto
- Considere otimizar analistas que frequentemente atingem timeout

## 🔧 **TROUBLESHOOTING**

### **Timeout Muito Curto**

```
Sintomas: Muitos timeouts em arquivos normais
Solução: Aumente ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS
```

### **Timeout Muito Longo**

```
Sintomas: Builds travando por analistas lentos
Solução: Diminua ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS
```

### **Analista Sempre com Timeout**

```
Sintomas: Mesmo analista sempre timeout
Solução: Verifique implementação do analista ou otimize algoritmo
```

---

**Esta funcionalidade garante robustez e previsibilidade na análise, mesmo em cenários adversos!** 🛡️
