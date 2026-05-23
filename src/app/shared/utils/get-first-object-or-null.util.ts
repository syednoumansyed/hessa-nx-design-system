// Returns the first object in an array if the array is valid and non-empty, otherwise returns null
export function getFirstObjectOrNull<T extends object>(
  arr: T[] | null,
): T | null {
  if (
    Array.isArray(arr) &&
    arr.length > 0 &&
    typeof arr[0] === 'object' &&
    arr[0] !== null
  ) {
    return arr[0] as T;
  }
  return null;
}
