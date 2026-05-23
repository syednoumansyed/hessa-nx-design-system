import {
  IMAGE_TYPES_PREVIEW_EXTENSTIONS,
  VIDEO_TYPES_PREVIEW_EXTENSTIONS,
} from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import { IAttachment } from '@shared/interfaces/attachment';

export function getAttachmentCategory(
  attachment: IAttachment,
): 'image' | 'pdf' | 'video' | 'ppt' | null {
  const type = attachment.extension || attachment.key || '';
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
    IMAGE_TYPES_PREVIEW_EXTENSTIONS.some((t) => type.toLowerCase().includes(t))
  ) {
    return 'image';
  }
  if (
    attachment.isLink ||
    VIDEO_TYPES_PREVIEW_EXTENSTIONS.some((t) => type.toLowerCase().includes(t))
  ) {
    return 'video';
  }
  return null;
}
