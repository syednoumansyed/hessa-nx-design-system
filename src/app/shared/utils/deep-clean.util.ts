const shouldKeepValue = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  !(typeof value === 'number' && Number.isNaN(value));

const deepCleanArray = (arr: unknown[]): unknown[] => {
  const cleaned = arr
    .map((item) => deepCleanValue(item))
    .filter((item) => item !== undefined);

  return cleaned;
};

const deepCleanObject = (
  obj: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  const cleanedEntries = Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const cleanedValue = deepCleanValue(value);
      if (cleanedValue !== undefined) {
        acc[key] = cleanedValue;
      }
      return acc;
    },
    {} as Record<string, unknown>,
  );

  if (Object.keys(cleanedEntries).length === 0) {
    return undefined;
  }

  return cleanedEntries;
};

export const deepCleanValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const cleanedArray = deepCleanArray(value);
    return cleanedArray.length > 0 ? cleanedArray : undefined;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return deepCleanObject(value as Record<string, unknown>);
  }

  return shouldKeepValue(value) ? value : undefined;
};

export const deepClean = <T>(value: T): T | undefined => {
  return deepCleanValue(value) as T | undefined;
};
