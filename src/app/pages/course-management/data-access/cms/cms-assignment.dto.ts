import { QuestionDTO } from '@pages/course-management/components/question-wrapper/data-access/question.dto';
import { IResponse } from '@shared/interfaces';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
export type AssignmentType = 'QUESTION' | 'WORKSHEET';
import { IAttachment } from '@shared/interfaces/attachment';
import { QuestionOptionDTO, QuestionType } from '../lms/lms-assignment.dto';

export interface CMSAssignmentDTO {
  id: string;
  title: string;
  type: AssignmentType;
  dueDate: string;
  description: string;
  isViewCorrectAnswer: boolean;
  questions: QuestionDTO[] | null;
  attachments: IAttachmentControlValue[];
  publishingDate: string;
}

export interface CMSAssignmentPayload {
  topicId: number;
  title: string;
  assignmentType: AssignmentType;
  dueDate: number;
  description: string;
  isViewCorrectAnswer: boolean;
}

export interface CMSAssignmentPreviewDTO {
  id: number;
  examId?: number | null;
  assignmentId?: number | null;
  text: string;
  type: QuestionType;
  modelAnswer?: string;
  isAttachmentAllowed: boolean;
  attachments?: IAttachment[];
  options?: QuestionOptionDTO[];
  createdBy?: number | null | { id: number; fullName: string };
  updatedBy?: number | null | { id: number; fullName: string };
  createdAt?: Date;
  updatedAt?: Date | null;
  answer: {
    answerText: string;
    attachments: IAttachment[];
    id: number;
    questionOptionId: number;
  };
}

export type CMSAssignmentResponseDTO = IResponse<CMSAssignmentDTO>;

export type CMSAssignmentResponsePreviewDTO = IResponse<{
  questions: CMSAssignmentPreviewDTO[];
  title: string;
}>;
