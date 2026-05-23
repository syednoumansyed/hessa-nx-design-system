/**
 * File utility functions for handling file types and extensions
 */

/**
 * Checks if a file extension represents an image file
 * @param extension - File extension (with or without dot)
 * @returns true if the extension is for an image file
 */
export function isImageExtension(extension?: string): boolean {
  if (!extension) return false;

  const cleanExtension = extension.toLowerCase().replace(/^\./, '');
  const imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg',
    'ico',
    'tiff',
    'tif',
    'avif',
    'heic',
    'heif',
  ];

  return imageExtensions.includes(cleanExtension);
}
