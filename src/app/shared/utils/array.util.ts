// array.util.ts
// Utility to always return an array (never null/undefined)
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
