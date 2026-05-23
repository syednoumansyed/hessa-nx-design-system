import { IResponse } from '@shared/interfaces';
import { QuestionTypeEnum } from './question-enum';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

export interface QuestionOptionDTO {
  id?: number;
  text: string;
  isCorrect: boolean;
}
export interface QuestionDTO {
  examId?: number;
  assignmentId?: number;
  id?: number | null;
  text: string;
  type: QuestionTypeEnum;
  modelAnswer?: string;
  isAttachmentAllowed: boolean;
  attachments?: IAttachmentControlValue[];
  questionOptions?: Array<QuestionOptionDTO>;
  options?: QuestionOptionDTO[];
}

export interface QuestionPayload {
  id?: number;
  assignmentId?: number;
  examId?: number;
  type: QuestionTypeEnum; // Assuming the type is from the same enum as in your active file
  text: string;
  modelAnswer?: string;
  isAttachmentAllowed?: boolean;
  attachments: Array<{ path: string; name: string }>;
  questionOptions?: Array<QuestionOptionDTO>; // Assuming QuestionOptionDTO is the same as defined in your active file
}

export type QuestionResponseDTO = IResponse<QuestionDTO>;
