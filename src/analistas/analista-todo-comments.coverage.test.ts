// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { analistaTodoComments } from './analista-todo-comments.js';

describe('analistaTodoComments (cobertura extra ramos)', () => {
  it('detecta TODO com variantes: TODO- e TODO(', () => {
    const src = `// TODO- dash\n/* TODO( with paren ) */`;
    const r1 = analistaTodoComments.aplicar(src, 'x.ts', null as any);
    expect(Array.isArray(r1) && r1.length >= 2).toBe(true);
  });
});
