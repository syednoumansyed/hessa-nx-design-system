// Constants for individual file types as arrays
export const IMAGE_TYPES_PREVIEW_EXTENSTIONS: string[] = [
  'png',
  'jpeg',
  'jpg',
  'webp',
];
export const COMMON_IMAGES_TYPES_PREVIEW_EXTENSTIONS: string[] = [
  'png',
  'jpeg',
  'jpg',
];
export const VIDEO_TYPES_PREVIEW_EXTENSTIONS: string[] = ['mp4', 'mov'];
export const PDF_TYPES_PREVIEW_EXTENSTIONS: string[] = ['pdf'];
export const PPT_TYPES_PREVIEW_EXTENSTIONS: string[] = ['ppt'];

type AcceptType = 'IMAGES' | 'FILES' | 'VIDEOS' | 'COMMON_IMAGES';
export type AcceptFileType = AcceptType[];
