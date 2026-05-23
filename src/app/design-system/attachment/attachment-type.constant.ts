// Constants for individual file types as arrays
export const DS_IMAGE_TYPES_PREVIEW_EXTENSIONS: string[] = [
  'png',
  'jpeg',
  'jpg',
  'webp',
];
export const DS_COMMON_IMAGES_TYPES_PREVIEW_EXTENSIONS: string[] = [
  'png',
  'jpeg',
  'jpg',
];
export const DS_VIDEO_TYPES_PREVIEW_EXTENSIONS: string[] = ['mp4'];
export const DS_PDF_TYPES_PREVIEW_EXTENSIONS: string[] = ['pdf'];
export const DS_PPT_TYPES_PREVIEW_EXTENSIONS: string[] = ['ppt', 'pptx'];
export const DS_WORD_TYPES_PREVIEW_EXTENSIONS: string[] = ['doc', 'docx'];
export const DS_EXCEL_TYPES_PREVIEW_EXTENSIONS: string[] = ['xls', 'xlsx'];

// MIME type mappings
const IMAGE_MIME_TYPES: string[] = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const COMMON_IMAGES_MIME_TYPES: string[] = [
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const VIDEO_MIME_TYPES: string[] = ['video/mp4'];

const PDF_MIME_TYPES: string[] = ['application/pdf'];

const PPT_MIME_TYPES: string[] = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const WORD_MIME_TYPES: string[] = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const EXCEL_MIME_TYPES: string[] = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALL_DOCUMENT_MIME_TYPES: string[] = [
  ...PDF_MIME_TYPES,
  ...PPT_MIME_TYPES,
  ...WORD_MIME_TYPES,
  ...EXCEL_MIME_TYPES,
];

// File type mappings
export const DS_FILE_TYPE_MAPPINGS = {
  IMAGES: {
    mimeTypes: IMAGE_MIME_TYPES,
    extensions: DS_IMAGE_TYPES_PREVIEW_EXTENSIONS,
    accept: IMAGE_MIME_TYPES.join(','),
  },
  COMMON_IMAGES: {
    mimeTypes: COMMON_IMAGES_MIME_TYPES,
    extensions: DS_COMMON_IMAGES_TYPES_PREVIEW_EXTENSIONS,
    accept: COMMON_IMAGES_MIME_TYPES.join(','),
  },
  VIDEOS: {
    mimeTypes: VIDEO_MIME_TYPES,
    extensions: DS_VIDEO_TYPES_PREVIEW_EXTENSIONS,
    accept: VIDEO_MIME_TYPES.join(','),
  },
  PDF: {
    mimeTypes: PDF_MIME_TYPES,
    extensions: DS_PDF_TYPES_PREVIEW_EXTENSIONS,
    accept: PDF_MIME_TYPES.join(','),
  },
  PPT: {
    mimeTypes: PPT_MIME_TYPES,
    extensions: DS_PPT_TYPES_PREVIEW_EXTENSIONS,
    accept: PPT_MIME_TYPES.join(','),
  },
  WORD: {
    mimeTypes: WORD_MIME_TYPES,
    extensions: DS_WORD_TYPES_PREVIEW_EXTENSIONS,
    accept: WORD_MIME_TYPES.join(','),
  },
  EXCEL: {
    mimeTypes: EXCEL_MIME_TYPES,
    extensions: DS_EXCEL_TYPES_PREVIEW_EXTENSIONS,
    accept: EXCEL_MIME_TYPES.join(','),
  },
  FILES: {
    mimeTypes: ALL_DOCUMENT_MIME_TYPES,
    extensions: [
      ...DS_PDF_TYPES_PREVIEW_EXTENSIONS,
      ...DS_PPT_TYPES_PREVIEW_EXTENSIONS,
      ...DS_WORD_TYPES_PREVIEW_EXTENSIONS,
      ...DS_EXCEL_TYPES_PREVIEW_EXTENSIONS,
    ],
    accept: ALL_DOCUMENT_MIME_TYPES.join(','),
  },
};

type DsAcceptType =
  | 'IMAGES'
  | 'FILES'
  | 'VIDEOS'
  | 'COMMON_IMAGES'
  | 'PDF'
  | 'PPT'
  | 'WORD'
  | 'EXCEL';
export type DsAcceptFileType = DsAcceptType[];

// Utility functions
export function getAcceptedMimeTypes(acceptTypes: DsAcceptFileType): string[] {
  if (!acceptTypes || acceptTypes.length === 0) {
    return [];
  }

  return acceptTypes.reduce<string[]>((acc, type) => {
    const mapping = DS_FILE_TYPE_MAPPINGS[type];
    if (mapping) {
      return [...acc, ...mapping.mimeTypes];
    }
    return acc;
  }, []);
}

export function getFileExtensions(acceptTypes: DsAcceptFileType): string[] {
  if (!acceptTypes || acceptTypes.length === 0) {
    return [];
  }

  const allExtensions = new Set<string>();
  acceptTypes.forEach((type) => {
    const mapping = DS_FILE_TYPE_MAPPINGS[type];
    if (mapping) {
      mapping.extensions.forEach((ext) => allExtensions.add(ext));
    }
  });

  return Array.from(allExtensions).sort();
}

export function getFileTypeName(mimeType: string): string {
  const typeMapping: { [key: string]: string } = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'video/mp4': 'mp4',
  };

  return typeMapping[mimeType] || mimeType.split('/').pop() || mimeType;
}
