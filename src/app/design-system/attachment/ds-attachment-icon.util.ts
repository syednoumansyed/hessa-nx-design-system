import type { DsAttachmentControlValue } from './attachment-control-value.interface';
import { dsGetAttachmentCategory } from './ds-get-attachment-type.util';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';

export function getDsAttachmentIcon(attachment: DsAttachmentControlValue): {
  icon: string;
  colorClass: string;
} {
  const category = dsGetAttachmentCategory(attachment);

  let icon = 'ds-attachment';
  if (category === 'image') {
    icon = 'ds-image';
  } else if (category === 'video') {
    icon = 'ds-video';
  } else if (category === 'pdf') {
    icon = 'ds-pdf';
  } else if (category === 'word') {
    icon = 'ds-ms-word';
  }

  return { icon, colorClass: getDsIconColorClass(icon) };
}
