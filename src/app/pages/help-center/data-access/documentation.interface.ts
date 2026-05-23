import { CreatedBy } from '@shared/dto-transformation';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

export interface HelpCenterDocument {
  id: number;
  title: string;
  isPrivate: boolean;
  supportCategoryId: number;
  content: string;
  status: string;
  language: string;
  articleType: string;
  createdBy: CreatedBy;
  category: HelpCenterDocumentCategory;
  attachments: IAttachmentControlUploadedValue[];
}

interface HelpCenterDocumentCategory {
  id: number;
  displayName: string;
  supportTypeId: number;
}

export type HelpCenterDocumentListItem = {
  articles: HelpCenterDocumentListItemArticles[];
  displayName: string;
  id: number;
};

export interface HelpCenterDocumentListItemArticles {
  title: string;
  isPrivate: boolean;
  id: number;
}
