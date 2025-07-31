import traverseModule from '@babel/traverse';
/**
 * Reexporta o método `traverse` do Babel para uso interno,
 * mantendo compatibilidade e controle centralizado.
 */
export const traverse = traverseModule.default;
