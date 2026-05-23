export function generateKeyFromUrl(prefix = ''): string {
  const url = window.location.href; // Get the full URL
  const parsedUrl = new URL(url);

  // Generate a key using pathname and query parameters
  const keyFromUrl = `${parsedUrl.pathname}${parsedUrl.search}`;
  // Replace unsafe characters for local storage keys
  const key = keyFromUrl.replace(/[^\w-]/g, '_'); // Replace non-alphanumeric with underscores
  return `${prefix}${key}`;
}
