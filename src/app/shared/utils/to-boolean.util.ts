export function toBoolean(value: string | boolean | undefined | null): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return value === 'true';
}
