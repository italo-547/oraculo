# Documentação JSDoc — Oráculo CLI

Este projeto utiliza [JSDoc](https://jsdoc.app/) para gerar documentação automática das funções, tipos e módulos.

## Como gerar a documentação

1. Instale o JSDoc globalmente (caso não tenha):
   ```sh
   npm install -g jsdoc
   ```
2. Execute o comando na raiz do projeto:
   ```sh
   jsdoc -c .vscode/jsdoc.json
   ```
3. A documentação será gerada em `docs/jsdoc/`.

## Padrão de anotação

- Sempre documente funções, classes, tipos e módulos públicos.
- Use `@param`, `@returns`, `@typedef`, `@template`, `@async`, `@throws` e outros tags relevantes.
- Exemplos:

```ts
/**
 * Soma dois números.
 * @param {number} a - O primeiro número.
 * @param {number} b - O segundo número.
 * @returns {number} A soma dos dois números.
 */
function soma(a, b) {
  return a + b;
}

/**
 * Executa uma ação assíncrona.
 * @async
 * @returns {Promise<void>}
 */
async function executar() { /* ... */ }
```

## Recomendações

- Documente helpers, utilitários, funções exportadas e tipos principais.
- Use exemplos reais e claros.
- Atualize a documentação sempre que alterar a assinatura de funções ou tipos.

---

Consulte a documentação gerada em `docs/jsdoc/` após rodar o comando acima.
