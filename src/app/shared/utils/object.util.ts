// Utility to check if a value is a plain object (not null, not array, not function)
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
