export function toNumberOrNull(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (normalized === '') {
    return null;
  }
  const parsed =
    typeof normalized === 'number' ? normalized : Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}
