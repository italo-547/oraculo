// SPDX-License-Identifier: MIT
// Declaração mínima para xxhashjs usada no projeto
declare module 'xxhashjs' {
  interface Hash64 {
    update(data: string | Buffer | ArrayBuffer): Hash64;
    digest(): number;
    toString(radix?: number): string;
  }
  interface XXHStatic {
    h64(input: string | Buffer, seed?: number): Hash64;
  }
  const XXH: XXHStatic;
  export default XXH;
}
