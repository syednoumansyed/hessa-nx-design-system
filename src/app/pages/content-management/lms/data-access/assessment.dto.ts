// Updated DTOs based on actual API responses

import { AssessmentStudentSubmissionStatus } from '@shared/enums';
import { IResponse } from '@shared/interfaces';

export type AssessmentExamResponseDto = IResponse<AssessmentExamDataDto>;

export interface AssessmentExamDataDto {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  style: AssessmentExamStyle;
  allowedAttempts: number;
  isViewCorrectAnswer: boolean;
  publishingDate: string;
  publishFor: string;
  startDate: string;
  dueDate: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  topic: AssessmentTopicDto;
  submissionData: AssessmentSubmissionDataDto | null;
  questions: AssessmentQuestionDto[];
}

export type AssessmentAssignmentResponseDto =
  IResponse<AssessmentAssignmentDataDto>;

// Type alias for the actual assignment detail response structure
export type AssignmentDetailResponseDto =
  IResponse<AssessmentAssignmentDataDto>;

export interface AssessmentAssignmentDataDto {
  id: number;
  topicId: number;
  tenantId: number;
  title: string;
  description: string;
  isViewCorrectAnswer: boolean;
  dueDate: string;
  publishingDate: string;
  publishFor: string;
  type: AssessmentAssignmentType;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  topic: AssessmentTopicDto;
  submissionData: AssessmentAssignmentSubmissionDataDto | null;
  worksheet: AssessmentWorksheetDto;
  attachments: AssessmentAttachmentDto[] | null;
  questions: AssessmentQuestionDto[];
  startDate: string;
  allowedAttempts: number;
}

export interface AssessmentTopicDto {
  id: number;
  title: string;
}

export interface AssessmentAnswerPayload {
  questionId: number;
  questionOptionId?: number;
  answerText?: string;
  attachments?: { path: string; name?: string }[];
}

export interface AssessmentSubmissionDataDto {
  id: number;
  studentId: number;
  examId: number | null;
  assignmentId: number | null;
  tenantId: number;
  submissionDate: string | null;
  correctAnswers: any | null;
  incorrectAnswers: any | null;
  status: AssessmentStudentSubmissionStatus;
  attemptsTaken: number;
  timeSpent: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  submissionStats: AssessmentSubmissionStatsDto | null;
}

export interface AssessmentAssignmentSubmissionDataDto {
  studentId: number;
  assignmentId: number;
  timeSpent: number;
  correctAnswers: any | null;
  attemptsTaken: number;
  submissionDate: string | null;
  createdAt: string;
  createdBy: number;
  tenantId: number;
  incorrectAnswers: any | null;
  submissionStats: AssessmentSubmissionStatsDto | null;
  status: AssessmentStudentSubmissionStatus;
}

export interface AssessmentSubmissionStatsDto {
  totalQuestions: number;
  correctAnswers: number;
  inCorrectAnswers: number;
}

export interface AssessmentWorksheetDto {
  attachments: AssessmentAttachmentDto[] | null;
}

export interface AssessmentQuestionDto {
  id: number;
  examId: number | null;
  assignmentId: number | null;
  tenantId: number;
  type: AssessmentQuestionType;
  text: string;
  modelAnswer: string | null;
  isAttachmentAllowed: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  questionView: QuestionViewDto | null;
  options: AssessmentQuestionOptionDto[] | null;
  attachments: AssessmentAttachmentDto[] | null;
  answer: AssessmentQuestionAnswerDto | null;
}

export interface AssessmentQuestionOptionDto {
  id: number;
  text: string;
  questionId: number;
  isCorrect?: boolean;
}

export interface AssessmentQuestionAnswerDto {
  id?: number;
  answerText?: string | null;
  attachments?: any;
  isCorrect?: boolean | null;
  questionOptionId?: number | null;
}

export interface AssessmentAttachmentDto {
  id: number;
  key: string;
  title: string;
  isLink?: boolean;
  targetId?: number;
  targetType?: string;
  url: string;
  extension: string;
}

export enum AssessmentExamStyle {
  CLASSIC = 'CLASSIC',
  OFFLINE = 'OFFLINE',
  QUESTION_BY_QUESTION = 'QUESTION_BY_QUESTION',
}

export enum AssessmentAssignmentType {
  QUESTION = 'QUESTION',
  WORKSHEET = 'WORKSHEET',
}

export enum AssessmentQuestionType {
  MCQ = 'MCQ',
  ESSAY = 'ESSAY',
  TRUE_OR_FALSE = 'TRUE_OR_FALSE',
}

export interface QuestionViewDto {
  id: number;
  questionId: number;
  studentId: number;
  viewed: boolean;
  displayed: boolean;
}
