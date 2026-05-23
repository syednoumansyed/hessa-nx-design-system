import { CreatedByDTO, UpdatedByDTO } from '@shared/dto-transformation';
import { IResponse } from '@shared/interfaces';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

export interface HelpCenterDocumentRequest {
  title: string;
  isPrivate: boolean;
  supportCategoryId: number;
  content: string;
  articleType: string;
  language: string;
  attachments?: Array<{ name: string; path: string }>;
}

export type HelpCenterDocumentType = 'ARTICLE' | 'QUESTION';

interface HelpCenterDocumentCategoryDTO {
  id: number;
  categoryArName: string;
  categoryEnName: string;
  supportTypeId: number;
}

export interface HelpCenterDocumentDTO {
  id: number;
  title: string;
  isPrivate: boolean;
  supportCategoryId: number;
  content: string;
  status: string;
  language: string;
  articleType: string;
  createdBy: CreatedByDTO;
  updatedBy: UpdatedByDTO | null;
  category: HelpCenterDocumentCategoryDTO;
  attachments: IAttachmentControlUploadedValue[];
}

export type HelpCenterDocumentListItemDTO = {
  articles: HelpCenterDocumentListItemArticlesDTO[];
  categoryArName: string;
  categoryEnName: string;
  id: number;
};

interface HelpCenterDocumentListItemArticlesDTO {
  title: string;
  isPrivate: boolean;
  id: number;
}

export type DocumentResponseDTO = IResponse<HelpCenterDocumentDTO>;

export type DocumentListResponseDTO = IResponse<
  HelpCenterDocumentListItemDTO[]
>;

export type FAQsListResponseDTO = DocumentListResponseDTO;
export type UserManualResponseDTO = DocumentListResponseDTO;
