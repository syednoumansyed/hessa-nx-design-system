type CleanedObject<T extends object> = {
  [K in keyof T]?: Exclude<T[K], null | undefined>;
};

export function cleanObject<T extends object>(obj: T): CleanedObject<T> {
  return Object.entries(obj as Record<string, unknown>).reduce(
    (acc, [key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !Number.isNaN(value)
      ) {
        acc[key as keyof T] = value as CleanedObject<T>[keyof T];
      }
      return acc;
    },
    {} as CleanedObject<T>,
  );
}
