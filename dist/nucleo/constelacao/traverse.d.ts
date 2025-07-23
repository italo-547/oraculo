import traverseModule from '@babel/traverse';
/**
 * Traverse do Babel com tipagem explícita.
 */
export declare const traverse: {
    <S>(parent: traverseModule.Node, opts: traverseModule.TraverseOptions<S>, scope: traverseModule.Scope | undefined, state: S, parentPath?: traverseModule.NodePath): void;
    (parent: traverseModule.Node, opts?: traverseModule.TraverseOptions, scope?: traverseModule.Scope, state?: any, parentPath?: traverseModule.NodePath): void;
    visitors: typeof traverseModule.visitors;
    verify: typeof traverseModule.visitors.verify;
    explode: typeof traverseModule.visitors.explode;
    cheap: (node: traverseModule.Node, enter: (node: traverseModule.Node) => void) => void;
    node: (node: traverseModule.Node, opts: traverseModule.TraverseOptions, scope?: traverseModule.Scope, state?: any, path?: traverseModule.NodePath, skipKeys?: Record<string, boolean>) => void;
    clearNode: (node: traverseModule.Node, opts?: traverseModule.RemovePropertiesOptions) => void;
    removeProperties: (tree: traverseModule.Node, opts?: traverseModule.RemovePropertiesOptions) => traverseModule.Node;
    hasType: (tree: traverseModule.Node, type: traverseModule.Node["type"], denylistTypes?: string[]) => boolean;
    cache: typeof traverseModule.cache;
};
//# sourceMappingURL=traverse.d.ts.map