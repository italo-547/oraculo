// SPDX-License-Identifier: MIT
// Stub para satisfazer analisadores estáticos que esperam chamadas a `registerCommand`.
// Nunca executa em runtime; apenas fornece um símbolo válido para análise estática.
export function registerCommand(_name: string, _handler: (...args: unknown[]) => unknown): void {
  // noop intentionally
}
