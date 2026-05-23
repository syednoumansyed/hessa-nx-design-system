import { DsAttachmentControlValue } from './attachment-control-value.interface';
import {
  DS_IMAGE_TYPES_PREVIEW_EXTENSIONS,
  DS_VIDEO_TYPES_PREVIEW_EXTENSIONS,
} from './attachment-type.constant';

export function dsGetAttachmentCategory(
  attachment: DsAttachmentControlValue,
): 'image' | 'pdf' | 'video' | 'ppt' | 'word' | 'excel' | null {
  const type =
    attachment instanceof File
      ? attachment.type
      : attachment.extension || attachment.key || '';
  if (type.includes('pdf')) {
    return 'pdf';
  }

  if (
    type.includes('ppt') ||
    type.includes('vnd.ms-powerpoint') ||
    type.includes(
      'vnd.openxmlformats-officedocument.presentationml.presentation',
    )
  ) {
    return 'ppt';
  }

  if (
    type.includes(
      'vnd.openxmlformats-officedocument.wordprocessingml.document',
    ) ||
    type.includes('vnd.ms-word') ||
    type.includes('msword') ||
    (type.includes('doc') && !type.includes('spreadsheet')) ||
    (type.includes('docx') && !type.includes('spreadsheet'))
  ) {
    return 'word';
  }

  if (
    type.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
    type.includes('vnd.ms-excel') ||
    type.includes('excel') ||
    type.includes('xls') ||
    type.includes('xlsx')
  ) {
    return 'excel';
  }

  if (
    DS_IMAGE_TYPES_PREVIEW_EXTENSIONS.some((t) =>
      type.toLowerCase().includes(t),
    )
  ) {
    return 'image';
  }
  if (
    DS_VIDEO_TYPES_PREVIEW_EXTENSIONS.some((t) =>
      type.toLowerCase().includes(t),
    )
  ) {
    return 'video';
  }
  return null;
}
