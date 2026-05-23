import { ReactionData } from '@ds/react/types/react.types';
import { UserProfileColors } from '@shared/enums';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

export interface IPostCardMeta {
  id?: number;
  title: string;
  content: string;
  attachments: IAttachmentControlValue[];
  createdBy: {
    id: number;
    displayName: string;
    profileColor?: UserProfileColors;
  };
  createdAt: string;
  createdFor?: string[];
  viewed?: boolean;
  reactions?: ReactionData[];
}
