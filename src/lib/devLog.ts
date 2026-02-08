/**
 * Dev-only console helpers. In production builds (import.meta.env.DEV === false),
 * these are no-ops, so no debug output is emitted.
 */
const isDev = import.meta.env.DEV;

export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args);
  }
}
