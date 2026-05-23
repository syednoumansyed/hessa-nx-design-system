export const isEmpty = (value: unknown): boolean => {
  // Check if value is null or undefined
  if (value == null || value === undefined) {
    return true;
  }

  // Check if value is an array or string and has length 0
  if (Array.isArray(value) || typeof value === 'string') {
    return value.length === 0;
  }

  // Check if value is an object and has no own enumerable properties
  if (typeof value === 'object') {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }

  // For other types, consider them as not empty
  return false;
};
