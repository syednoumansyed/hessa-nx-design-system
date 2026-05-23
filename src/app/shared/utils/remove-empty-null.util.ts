export function removeEmptyOrNull(obj: Record<string, any>) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === '' || obj[key] === null) {
      delete obj[key];
    }
  });
  return obj;
}
